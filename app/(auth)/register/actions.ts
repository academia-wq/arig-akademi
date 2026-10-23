"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

// Бүртгэлийн холбоосны кодоор идэвхтэй франчайзын нэрийг буцаана.
// Франчайзыг бүртгэлд оноох нь handle_new_user trigger-т кодоор дахин шалгагдана.
export async function getFranchiseByCode(code: string): Promise<{ name: string } | null> {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,32}$/.test(normalized)) return null;
  const { data } = await createServiceRoleClient()
    .from("franchises")
    .select("name")
    .eq("invite_code", normalized)
    .eq("is_active", true)
    .maybeSingle();
  return data ? { name: data.name } : null;
}
