import "server-only";
import { createServiceRoleClient, getUser } from "@/lib/supabase/server";

// Франчайзын самбарт хандах эрх:
// - франчайзын менежер зөвхөн өөрийн франчайзыг (franchiseId),
// - admin/instructor бүх франчайзыг (franchiseId = null — дуртайгаа сонгоно).
export async function requireFranchiseViewer() {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "Нэвтрээгүй байна." };
  const { data: profile } = await createServiceRoleClient()
    .from("profiles")
    .select("role, franchise_id")
    .eq("id", user.id)
    .single();
  if (profile?.role === "admin" || profile?.role === "instructor") {
    return { ok: true as const, userId: user.id, isStaff: true, franchiseId: null };
  }
  if (profile?.role === "franchise_manager" && profile.franchise_id) {
    return {
      ok: true as const,
      userId: user.id,
      isStaff: false,
      franchiseId: profile.franchise_id as string,
    };
  }
  return { ok: false as const, error: "Энэ үйлдэлд эрх хүрэлцэхгүй байна." };
}
