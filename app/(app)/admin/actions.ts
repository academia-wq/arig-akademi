"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";

const SUPPORTED_PDF_MIME_TYPES = ["application/pdf"];
const MAX_PDF_BYTES = 20 * 1024 * 1024;

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9Ѐ-ӿ\s-]/g, "")
    .replace(/\s+/g, "-");
}

function parseDurationToSeconds(text: string): number | null {
  const match = text.trim().match(/([\d.]+)\s*(цаг|мин)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (isNaN(value)) return null;
  const unit = match[2] || "цаг";
  return Math.round(unit === "мин" ? value * 60 : value * 3600);
}

async function requireStaff() {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "Нэвтрээгүй байна." };
  const supabase = createClient();
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin" && myProfile?.role !== "instructor") {
    return { ok: false as const, error: "Эрхгүй байна." };
  }
  return { ok: true as const, userId: user.id };
}

export async function assignEmployee(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const profileId = formData.get("profileId") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  if (!profileId || !department || !position) {
    return { success: false, error: "Бүх талбарыг бөглөнө үү." };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("profiles")
    .update({ department, position })
    .eq("id", profileId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function createModuleWithLesson(
  formData: FormData
): Promise<
  | { success: true; courseId: string; moduleId: string; lessonId: string }
  | { success: false; error: string }
> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const supabase = createServiceRoleClient();
  const existingCourseId = (formData.get("courseId") as string) || "";
  const newCourseTitle = ((formData.get("newCourseTitle") as string) || "").trim();
  const moduleTitle = ((formData.get("moduleTitle") as string) || "").trim();
  const category = ((formData.get("category") as string) || "").trim();
  const durationText = (formData.get("duration") as string) || "";

  if (!moduleTitle) return { success: false, error: "Сургалтын нэрээ оруулна уу." };
  if (!existingCourseId && !newCourseTitle) {
    return { success: false, error: "Бүлгээ сонгоно уу." };
  }

  let courseId = existingCourseId;
  if (!courseId) {
    const { data: newCourse, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: newCourseTitle,
        slug: slugify(newCourseTitle),
        instructor_id: staff.userId,
        is_published: false,
      })
      .select("id")
      .single();
    if (courseError || !newCourse) {
      return { success: false, error: courseError?.message || "Бүлэг үүсгэж чадсангүй." };
    }
    courseId = newCourse.id;
  }

  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const { data: newModule, error: moduleError } = await supabase
    .from("modules")
    .insert({
      course_id: courseId,
      title: moduleTitle,
      category: category || null,
      position: count || 0,
    })
    .select("id")
    .single();
  if (moduleError || !newModule) {
    return { success: false, error: moduleError?.message || "Бүлэг үүсгэж чадсангүй." };
  }

  const { data: newLesson, error: lessonError } = await supabase
    .from("lessons")
    .insert({
      module_id: newModule.id,
      title: moduleTitle,
      duration_seconds: parseDurationToSeconds(durationText),
      position: 0,
    })
    .select("id")
    .single();
  if (lessonError || !newLesson) {
    return { success: false, error: lessonError?.message || "Хичээл үүсгэж чадсангүй." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { success: true, courseId, moduleId: newModule.id, lessonId: newLesson.id };
}

export async function uploadLessonMaterial(
  lessonId: string,
  courseId: string,
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "PDF файл сонгоно уу." };
  }
  if (!SUPPORTED_PDF_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "Зөвхөн PDF файл дэмжигдэнэ." };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { success: false, error: "Файлын хэмжээ 20MB-с хэтэрсэн байна." };
  }

  const admin = createServiceRoleClient();
  const path = `${lessonId}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await admin.storage
    .from("lesson-materials")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: uploadError.message };

  const { data: publicUrlData } = admin.storage.from("lesson-materials").getPublicUrl(path);

  const { data: lessonRow } = await admin
    .from("lessons")
    .select("material_urls")
    .eq("id", lessonId)
    .single();
  const nextUrls = [...((lessonRow?.material_urls as string[] | null) || []), publicUrlData.publicUrl];

  const { error: updateError } = await admin
    .from("lessons")
    .update({ material_urls: nextUrls })
    .eq("id", lessonId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { success: true, url: publicUrlData.publicUrl };
}
