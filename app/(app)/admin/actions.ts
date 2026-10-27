"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendEmployeeInviteEmail } from "@/lib/email/invite-email";
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

// Ажилтны төрөл: "core" (үндсэн) эсвэл "franchise" + идэвхтэй франчайзын id.
async function parseEmployeeType(
  formData: FormData
): Promise<
  | { ok: true; employee_type: "core" | "franchise"; franchise_id: string | null }
  | { ok: false; error: string }
> {
  const type = formData.get("employeeType") === "franchise" ? "franchise" : "core";
  if (type === "core") return { ok: true, employee_type: "core", franchise_id: null };
  const franchiseId = String(formData.get("franchiseId") || "");
  if (!franchiseId) return { ok: false, error: "Франчайзаа сонгоно уу." };
  const { data } = await createServiceRoleClient()
    .from("franchises")
    .select("id")
    .eq("id", franchiseId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Франчайз олдсонгүй." };
  return { ok: true, employee_type: "franchise", franchise_id: franchiseId };
}

function parseAudience(formData: FormData): "core" | "franchise" | "all" {
  const v = formData.get("audience");
  return v === "franchise" || v === "all" ? v : "core";
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
  const type = await parseEmployeeType(formData);
  if (!type.ok) return { success: false, error: type.error };

  const admin = createServiceRoleClient();
  const { data: current } = await admin
    .from("profiles")
    .select("role, franchise_id")
    .eq("id", profileId)
    .single();
  // "Франчайзын менежер" сонголт (Ажилтан засах цонх) ирсэн бол түүгээр, үгүй бол
  // франчайзаас гарах/шилжихэд менежерийн эрх цуцлагдана. Админ, багшийн эрхэд хүрэхгүй.
  const isStaffRole = current?.role === "admin" || current?.role === "instructor";
  const wantsManager = formData.get("isFranchiseManager");
  let nextRole: "student" | "franchise_manager" | null = null;
  if (!isStaffRole) {
    if (wantsManager !== null) {
      nextRole = wantsManager === "true" && type.employee_type === "franchise" ? "franchise_manager" : "student";
    } else if (current?.role === "franchise_manager" && current.franchise_id !== type.franchise_id) {
      nextRole = "student";
    }
  }
  const { error } = await admin
    .from("profiles")
    .update({
      department,
      position,
      employee_type: type.employee_type,
      franchise_id: type.franchise_id,
      ...(nextRole ? { role: nextRole } : {}),
    })
    .eq("id", profileId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

// Админ шинэ ажилтныг нэр, имэйлээр нь шууд үүсгэнэ. Ажилтан нууц үгээ
// /set-password холбоосоор өөрөө тохируулна (холбоосыг имэйлээр илгээж,
// админд хуулж өгөх боломжтой харуулна). Хуучин бүртгүүлж амжаагүй урилгыг
// дахин үүсгэвэл шинэ холбоос гаргана.
export async function createEmployee(formData: FormData): Promise<
  | { success: true; link: string; emailed: boolean; resent: boolean }
  | { success: false; error: string }
> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const department = String(formData.get("department") || "");
  const position = String(formData.get("position") || "");
  if (!fullName || !email || !department || !position) {
    return { success: false, error: "Бүх талбарыг бөглөнө үү." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Имэйл хаяг буруу байна." };
  }
  const empType = await parseEmployeeType(formData);
  if (!empType.ok) return { success: false, error: empType.error };

  const admin = createServiceRoleClient();

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { success: false, error: listError.message };
  const existing = list.users.find((u) => u.email?.toLowerCase() === email);
  if (existing?.last_sign_in_at) {
    return {
      success: false,
      error: "Энэ имэйлээр бүртгэл байна. Ажилтны жагсаалтаас засна уу.",
    };
  }

  const type = existing ? "magiclink" : "invite";
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type,
    email,
    options: { data: { full_name: fullName } },
  });
  if (linkError || !linkData.user) {
    return { success: false, error: linkError?.message || "Бүртгэл үүсгэж чадсангүй." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      department,
      position,
      employee_type: empType.employee_type,
      franchise_id: empType.franchise_id,
    })
    .eq("id", linkData.user.id);
  if (profileError) return { success: false, error: profileError.message };

  const origin =
    headers().get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://arig-akademi.vercel.app";
  const link = `${origin}/set-password?token_hash=${encodeURIComponent(
    linkData.properties.hashed_token
  )}&type=${type}`;

  let emailed = false;
  try {
    await sendEmployeeInviteEmail({ email, fullName, link });
    emailed = true;
  } catch {
    // Resend-ийн домэйн баталгаажаагүй үед зөвхөн эзэмшигчийн хаяг руу илгээнэ —
    // энэ тохиолдолд админ холбоосыг хуулж өгнө.
  }

  revalidatePath("/admin");
  return { success: true, link, emailed, resent: !!existing };
}

export async function createModuleWithLesson(
  formData: FormData
): Promise<
  | {
      success: true;
      courseId: string;
      moduleId: string;
      lessonId: string;
      // Бүх үүссэн хичээл дарааллаараа — олон зургийг хичээл бүрт оноохад ашиглана.
      lessonIds: string[];
    }
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
  const parsedLessonCount = parseInt((formData.get("lessonCount") as string) || "1", 10);
  const lessonCount =
    Number.isFinite(parsedLessonCount) && parsedLessonCount > 0
      ? Math.min(parsedLessonCount, 50)
      : 1;

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
      audience: parseAudience(formData),
      position: count || 0,
    })
    .select("id")
    .single();
  if (moduleError || !newModule) {
    return { success: false, error: moduleError?.message || "Бүлэг үүсгэж чадсангүй." };
  }

  const lessonRows = Array.from({ length: lessonCount }, (_, i) => ({
    module_id: newModule.id,
    title: lessonCount > 1 ? `${moduleTitle} ${i + 1}` : moduleTitle,
    duration_seconds: i === 0 ? parseDurationToSeconds(durationText) : null,
    position: i,
  }));

  const { data: newLessons, error: lessonError } = await supabase
    .from("lessons")
    .insert(lessonRows)
    .select("id, position");
  if (lessonError || !newLessons?.length) {
    return { success: false, error: lessonError?.message || "Хичээл үүсгэж чадсангүй." };
  }
  const orderedLessons = [...newLessons].sort((a, b) => a.position - b.position);

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return {
    success: true,
    courseId,
    moduleId: newModule.id,
    lessonId: orderedLessons[0].id,
    lessonIds: orderedLessons.map((l) => l.id),
  };
}

export async function updateModule(
  moduleId: string,
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const supabase = createServiceRoleClient();
  const existingCourseId = (formData.get("courseId") as string) || "";
  const newCourseTitle = ((formData.get("newCourseTitle") as string) || "").trim();
  const moduleTitle = ((formData.get("moduleTitle") as string) || "").trim();
  const category = ((formData.get("category") as string) || "").trim();

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

  const { error } = await supabase
    .from("modules")
    .update({
      title: moduleTitle,
      category: category || null,
      audience: parseAudience(formData),
      course_id: courseId,
    })
    .eq("id", moduleId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return { success: true };
}

export async function deleteModuleAdmin(
  moduleId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const supabase = createServiceRoleClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId);
  const lessonIds = (lessons || []).map((l) => l.id);
  if (lessonIds.length) {
    await supabase.from("lesson_progress").delete().in("lesson_id", lessonIds);
    await supabase.from("lessons").delete().in("id", lessonIds);
  }
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
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

// ─── Франчайз ───

function generateInviteCode() {
  // Андуурагдах тэмдэгтгүй (0/O, 1/I) 8 тэмдэгт.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function createFranchise(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { success: false, error: "Франчайзын нэрээ оруулна уу." };

  const { error } = await createServiceRoleClient()
    .from("franchises")
    .insert({ name, invite_code: generateInviteCode() });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/franchise");
  return { success: true };
}

export async function updateFranchise(
  franchiseId: string,
  patch: { name?: string; is_active?: boolean; regenerateCode?: boolean }
): Promise<{ success: true } | { success: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const update: { name?: string; is_active?: boolean; invite_code?: string } = {};
  if (patch.name !== undefined) {
    if (!patch.name.trim()) return { success: false, error: "Франчайзын нэрээ оруулна уу." };
    update.name = patch.name.trim();
  }
  if (patch.is_active !== undefined) update.is_active = patch.is_active;
  if (patch.regenerateCode) update.invite_code = generateInviteCode();

  const { error } = await createServiceRoleClient()
    .from("franchises")
    .update(update)
    .eq("id", franchiseId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/franchise");
  return { success: true };
}

// Франчайзын ажилтныг тухайн франчайзын менежер болгох / эрхийг нь цуцлах.
export async function setFranchiseManager(
  profileId: string,
  makeManager: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) return { success: false, error: staff.error };

  const admin = createServiceRoleClient();
  const { data: target } = await admin
    .from("profiles")
    .select("role, franchise_id, employee_type")
    .eq("id", profileId)
    .single();
  if (!target) return { success: false, error: "Ажилтан олдсонгүй." };
  if (target.role === "admin" || target.role === "instructor") {
    return { success: false, error: "Админ, багшийн эрхийг энд өөрчлөхгүй." };
  }
  if (makeManager && (target.employee_type !== "franchise" || !target.franchise_id)) {
    return { success: false, error: "Зөвхөн франчайзын ажилтныг менежер болгоно." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: makeManager ? "franchise_manager" : "student" })
    .eq("id", profileId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/franchise");
  return { success: true };
}
