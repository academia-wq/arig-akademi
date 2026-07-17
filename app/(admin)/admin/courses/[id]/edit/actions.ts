"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import {
  extractFileText,
  generateCourseDraftFromText,
  type CourseDraft,
} from "@/lib/anthropic/course-from-file";
import { SUPPORTED_MIME_TYPES } from "@/lib/constants/file-upload";

const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024;
const COURSE_DRAFT_FEATURE = "course_draft_from_file";
const COURSE_DRAFT_DAILY_LIMIT = 5;

const SUPPORTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function uploadLessonImage(
  lessonId: string,
  courseId: string,
  formData: FormData
): Promise<{ success: true; imageUrl: string } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Зураг сонгоно уу." };
  }
  if (!SUPPORTED_IMAGE_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "Зөвхөн JPEG, PNG, WEBP эсвэл GIF зураг дэмжигдэнэ." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: "Зурагны хэмжээ 8MB-с хэтэрсэн байна." };
  }

  const supabase = createServiceRoleClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${lessonId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("lesson-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("lesson-images").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("lessons")
    .update({ image_url: publicUrlData.publicUrl })
    .eq("id", lessonId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { success: true, imageUrl: publicUrlData.publicUrl };
}

export async function generateDraftFromFile(
  courseId: string,
  formData: FormData
): Promise<{ success: true; draft: CourseDraft } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const supabase = createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: usageCount } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("feature", COURSE_DRAFT_FEATURE)
    .gte("created_at", since);

  if ((usageCount || 0) >= COURSE_DRAFT_DAILY_LIMIT) {
    return {
      success: false,
      error: `Өдрийн файлаас үүсгэх хязгаар (${COURSE_DRAFT_DAILY_LIMIT} удаа/24 цаг) хүрсэн байна. Маргааш дахин оролдоно уу.`,
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Файл сонгоно уу." };
  }
  if (!SUPPORTED_MIME_TYPES.includes(file.type as (typeof SUPPORTED_MIME_TYPES)[number])) {
    return { success: false, error: "Зөвхөн PDF, Word (.docx) эсвэл Excel (.xlsx/.xls) файл дэмжигдэнэ." };
  }
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    return { success: false, error: "Файлын хэмжээ 15MB-с хэтэрсэн байна." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sourceText = await extractFileText(buffer, file.type);
    const draft = await generateCourseDraftFromText(sourceText);

    await supabase
      .from("ai_usage_logs")
      .insert({ user_id: user.id, feature: COURSE_DRAFT_FEATURE });

    return { success: true, draft };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Тодорхойгүй алдаа гарлаа.",
    };
  }
}

export async function saveDraftStructure(
  courseId: string,
  draft: CourseDraft
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const supabase = createClient();

  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const moduleOffset = count || 0;
  const moduleRows = draft.modules.map((mod, index) => ({
    course_id: courseId,
    title: mod.title,
    position: moduleOffset + index,
  }));

  const { data: insertedModules, error: moduleError } = await supabase
    .from("modules")
    .insert(moduleRows)
    .select("id");

  if (moduleError || !insertedModules) {
    return { success: false, error: moduleError?.message || "Бүлэг үүсгэж чадсангүй." };
  }

  const lessonRows = draft.modules.flatMap((mod, modIndex) =>
    mod.lessons.map((lesson, lessonIndex) => ({
      module_id: insertedModules[modIndex].id,
      title: lesson.title,
      content_text: lesson.content_text,
      position: lessonIndex,
    }))
  );

  const { error: lessonError } = await supabase.from("lessons").insert(lessonRows);
  if (lessonError) {
    return { success: false, error: lessonError.message };
  }

  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { success: true };
}
