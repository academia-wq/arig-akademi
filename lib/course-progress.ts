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
  const completed = completedCount || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { course, progress, durationSeconds, totalLessons: total, completedLessons: completed };
}

// Хэрэглэгчийн курс тус бүрийн хамгийн сүүлд дуусгасан хичээлийн огноог
// буцаана (курс "дуусгасан" болсон огноо гэж үзнэ).
export async function getLastCompletedDatesByCourse(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, string>> {
  const { data: rows } = await supabase
    .from("lesson_progress")
    .select("completed_at, lessons(modules(course_id))")
    .eq("user_id", userId)
    .eq("is_completed", true);

  const result = new Map<string, string>();
  for (const row of rows || []) {
    const courseId = (row as any).lessons?.modules?.course_id;
    const completedAt = (row as any).completed_at;
    if (!courseId || !completedAt) continue;
    const prev = result.get(courseId);
    if (!prev || completedAt > prev) result.set(courseId, completedAt);
  }
  return result;
}
