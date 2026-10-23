import "server-only";
import { createServiceRoleClient, getUser } from "@/lib/supabase/server";

// Франчайзын менежер мөн эсэхийг шалгаж, түүний франчайзын id-г буцаана.
export async function requireFranchiseManager() {
  const user = await getUser();
  if (!user) return { ok: false as const, error: "Нэвтрээгүй байна." };
  const { data: profile } = await createServiceRoleClient()
    .from("profiles")
    .select("role, franchise_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "franchise_manager" || !profile.franchise_id) {
    return { ok: false as const, error: "Энэ үйлдэлд эрх хүрэлцэхгүй байна." };
  }
  return { ok: true as const, userId: user.id, franchiseId: profile.franchise_id };
}
