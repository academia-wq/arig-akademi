"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";

type Result = { success: true } | { success: false; error: string };

// Supabase-ийн хориг (ban) — идэвхгүй хэрэглэгч нэвтэрч чадахгүй, өгөгдөл нь хадгалагдана.
const DEACTIVATED_BAN = "876000h"; // ~100 жил

async function requireRole(allowed: ("admin" | "instructor")[]) {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "Нэвтрээгүй байна." };
  const { data: profile } = await createClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!allowed.includes(profile?.role as "admin" | "instructor")) {
    return { ok: false as const, error: "Энэ үйлдэлд эрх хүрэлцэхгүй байна." };
  }
  return { ok: true as const, userId: user.id };
}

// Хүснэгт production DB-д үүсээгүй байж болно (CLAUDE.md, асуудал №4).
function isMissingTable(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

export async function setUserActive(userId: string, active: boolean): Promise<Result> {
  const staff = await requireRole(["admin", "instructor"]);
  if (!staff.ok) return { success: false, error: staff.error };
  if (userId === staff.userId) {
    return { success: false, error: "Өөрийгөө идэвхгүй болгох боломжгүй." };
  }

  const { error } = await createServiceRoleClient().auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : DEACTIVATED_BAN,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUserPermanently(userId: string): Promise<Result> {
  const admin = await requireRole(["admin"]);
  if (!admin.ok) return { success: false, error: "Бүрмөсөн устгахыг зөвхөн админ хийнэ." };
  if (userId === admin.userId) {
    return { success: false, error: "Өөрийгөө устгах боломжгүй." };
  }

  const db = createServiceRoleClient();

  // Энэ хүнийг заасан холбоосуудыг салгана (эс тэгвээс профайл устгахыг DB хориглоно),
  // дараа нь хэрэглэгчийн өөрийн өгөгдлийг устгана (мэдэгдэл нь profile-тай хамт cascade-аар устна).
  const steps: [string, () => PromiseLike<{ error: { code?: string; message: string } | null }>][] = [
    ["courses", () => db.from("courses").update({ instructor_id: null }).eq("instructor_id", userId)],
    ["academy_structure", () => db.from("academy_structure").update({ updated_by: null }).eq("updated_by", userId)],
    ["onboarding_plans", () => db.from("onboarding_plans").update({ created_by: null }).eq("created_by", userId)],
    ["ai_usage_logs", () => db.from("ai_usage_logs").delete().eq("user_id", userId)],
    ["lesson_progress", () => db.from("lesson_progress").delete().eq("user_id", userId)],
    ["enrollments", () => db.from("enrollments").delete().eq("user_id", userId)],
  ];
  for (const [table, step] of steps) {
    const { error } = await step();
    if (error && !isMissingTable(error)) {
      return { success: false, error: `${table}: ${error.message}` };
    }
  }

  const { error: profileError } = await db.from("profiles").delete().eq("id", userId);
  if (profileError) return { success: false, error: `profiles: ${profileError.message}` };

  const { error: authError } = await db.auth.admin.deleteUser(userId);
  if (authError) return { success: false, error: authError.message };

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { success: true };
}
