"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireFranchiseViewer } from "@/lib/franchise-auth";
import { DEPARTMENTS, POSITIONS } from "@/lib/departments";

type Result = { success: true } | { success: false; error: string };

const DEACTIVATED_BAN = "876000h"; // ~100 жил — students/actions.ts-тэй ижил

// Зорилтот хүн франчайзын энгийн ажилтан мөн эсэх: менежерт зөвхөн өөрийн
// франчайзынх, admin/instructor-т аль ч франчайзынх.
async function requireOwnEmployee(profileId: string) {
  const manager = await requireFranchiseViewer();
  if (!manager.ok) return manager;
  if (profileId === manager.userId) {
    return { ok: false as const, error: "Өөрийгөө өөрчлөх боломжгүй." };
  }
  const { data: target } = await createServiceRoleClient()
    .from("profiles")
    .select("franchise_id, role")
    .eq("id", profileId)
    .single();
  const inScope = manager.isStaff ? !!target?.franchise_id : target?.franchise_id === manager.franchiseId;
  if (!target || !inScope || target.role !== "student") {
    return { ok: false as const, error: "Энэ ажилтан таны франчайзад харьяалагдахгүй байна." };
  }
  return manager;
}

export async function updateFranchiseEmployee(formData: FormData): Promise<Result> {
  const profileId = String(formData.get("profileId") || "");
  const department = String(formData.get("department") || "");
  const position = String(formData.get("position") || "");
  const check = await requireOwnEmployee(profileId);
  if (!check.ok) return { success: false, error: check.error };
  if (!DEPARTMENTS.includes(department) || !POSITIONS[department]?.includes(position)) {
    return { success: false, error: "Хэлтэс, албан тушаалаа сонгоно уу." };
  }

  const { error } = await createServiceRoleClient()
    .from("profiles")
    .update({ department, position })
    .eq("id", profileId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/franchise");
  return { success: true };
}

export async function setFranchiseEmployeeActive(profileId: string, active: boolean): Promise<Result> {
  const check = await requireOwnEmployee(profileId);
  if (!check.ok) return { success: false, error: check.error };

  const { error } = await createServiceRoleClient().auth.admin.updateUserById(profileId, {
    ban_duration: active ? "none" : DEACTIVATED_BAN,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/franchise");
  return { success: true };
}
