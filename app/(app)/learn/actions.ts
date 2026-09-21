"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

export async function completeModule(
  moduleId: string,
  courseSlug: string
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Нэвтрээгүй байна." };

  const supabase = createClient();

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId);
  if (lessonsError || !lessons || lessons.length === 0) {
    return { success: false, error: lessonsError?.message || "Хичээл олдсонгүй." };
  }

  const lessonIds = lessons.map((l) => l.id);
  const { data: alreadyDone } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .in("lesson_id", lessonIds);
  const doneSet = new Set((alreadyDone || []).map((r) => r.lesson_id));

  const now = new Date().toISOString();
  const rows = lessonIds
    .filter((id) => !doneSet.has(id))
    .map((id) => ({
      user_id: user.id,
      lesson_id: id,
      is_completed: true,
      completed_at: now,
    }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(rows, { onConflict: "user_id,lesson_id" });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath(`/learn/${courseSlug}`, "layout");
  return { success: true };
}
