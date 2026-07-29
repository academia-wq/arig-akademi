import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { computeLevel } from "@/lib/gamification";

export default async function DashboardPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { count: totalCompletedLessons } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_completed", true);

  const { level, lessonsIntoLevel, lessonsToNextLevel, progressPercent } = computeLevel(
    totalCompletedLessons || 0
  );

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, slug, thumbnail_url)")
    .eq("user_id", user.id);

  // Курс тус бүрийн явцыг тооцоолох (хичээлийн тоо vs дууссан тоо)
  const coursesWithProgress = await Promise.all(
    (enrollments || []).map(async (enrollment: any) => {
      const course = enrollment.courses;

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, modules!inner(course_id)")
        .eq("modules.course_id", course.id);

      const lessonIds = (lessons || []).map((l: any) => l.id);

      const { count: completedCount } = await supabase
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .in("lesson_id", lessonIds.length ? lessonIds : ["00000000-0000-0000-0000-000000000000"]);

      const total = lessonIds.length;
      const progress = total > 0 ? Math.round(((completedCount || 0) / total) * 100) : 0;

      return { course, progress };
    })
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Миний курсууд
      </h1>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-ink/10 bg-white p-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-xl font-bold text-white">
          {level}
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-ink">
            Level {level}
          </p>
          <div className="mt-1.5 h-2 rounded-full bg-ink/5">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink/50">
            {lessonsIntoLevel}/10 хичээл дуусгасан — дараагийн level хүртэл{" "}
            {lessonsToNextLevel} хичээл үлдлээ
          </p>
        </div>
      </div>

      {coursesWithProgress.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-ink/20 p-10 text-center">
          <p className="text-ink/60">Та одоогоор ямар ч курст элсээгүй байна.</p>
          <Link
            prefetch={false}
            href="/learn"
            className="focus-ring mt-4 inline-block font-medium text-brand-500"
          >
            Сургалт эхлэх →
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {coursesWithProgress.map(({ course, progress }) => (
          <Link
            prefetch={false}
            key={course.id}
            href={`/learn/${course.slug}`}
            className="focus-ring rounded-lg border border-ink/10 bg-white p-5 hover:border-brand-300"
          >
            <h2 className="font-display font-bold text-ink">{course.title}</h2>
            <div className="mt-3 h-2 rounded-full bg-ink/5">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-ink/60">{progress}% дууссан</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
