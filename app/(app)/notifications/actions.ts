"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

export async function markNotificationRead(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<
  { success: true } | { success: false; error: string }
> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteNotification(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}
