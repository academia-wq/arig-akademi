import type { SupabaseClient } from "@supabase/supabase-js";

export async function computeCourseProgress(
  supabase: SupabaseClient,
  userId: string,
  course: { id: string; [key: string]: any }
) {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, duration_seconds, modules!inner(course_id)")
    .eq("modules.course_id", course.id);

  const lessonIds = (lessons || []).map((l: any) => l.id);
  const durationSeconds = (lessons || []).reduce(
    (sum: number, l: any) => sum + (l.duration_seconds || 0),
    0
  );

  const { count: completedCount } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true)
    .in("lesson_id", lessonIds.length ? lessonIds : ["00000000-0000-0000-0000-000000000000"]);

  const total = lessonIds.length;
  const progress = total > 0 ? Math.round(((completedCount || 0) / total) * 100) : 0;

  return { course, progress, durationSeconds };
}
