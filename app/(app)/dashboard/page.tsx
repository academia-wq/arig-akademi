import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { computeLevel } from "@/lib/gamification";
import { CourseCard } from "@/components/course-card";
import { ArrowRightIcon, BookIcon } from "@/components/icons";
import { formatDuration } from "@/lib/format";

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
    .select("course_id, courses(id, title, slug, description, thumbnail_url)")
    .eq("user_id", user.id);

  // Курс тус бүрийн явц, нийт үргэлжлэх хугацааг тооцоолох
  const coursesWithProgress = await Promise.all(
    (enrollments || []).map(async (enrollment: any) => {
      const course = enrollment.courses;

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
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .in("lesson_id", lessonIds.length ? lessonIds : ["00000000-0000-0000-0000-000000000000"]);

      const total = lessonIds.length;
      const progress = total > 0 ? Math.round(((completedCount || 0) / total) * 100) : 0;

      return { course, progress, durationSeconds };
    })
  );

  if (coursesWithProgress.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Нүүр</h1>
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
      </div>
    );
  }

  // Идэвхтэй ("үргэлжилж буй") курсийг hero-д онцолж, бусдыг доор нь жагсаана
  const featured =
    coursesWithProgress.find((c) => c.progress > 0 && c.progress < 100) ||
    coursesWithProgress[0];
  const rest = coursesWithProgress.filter(
    (c) => c.course.id !== featured.course.id
  );

  const featuredDuration = formatDuration(featured.durationSeconds);
  const featuredLabel =
    featured.progress >= 100
      ? "Дууссан"
      : featured.progress > 0
      ? "Үргэлжилж буй"
      : "Санал болгож буй";
  const featuredCta =
    featured.progress >= 100
      ? "Дахин үзэх"
      : featured.progress > 0
      ? "Үргэлжлүүлэх"
      : "Эхлэх";

  return (
    <div>
      <section className="grid items-center gap-8 rounded-2xl border border-brand-100 bg-brand-50 p-8 md:grid-cols-[1fr_auto] md:p-12">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
            {featuredLabel}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
            {featured.course.title}
          </h1>
          {featured.course.description && (
            <p className="mt-3 max-w-xl text-ink/70">
              {featured.course.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link
              prefetch={false}
              href={`/learn/${featured.course.slug}`}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
            >
              {featuredCta}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            {featuredDuration && (
              <span className="text-sm text-ink/50">{featuredDuration}</span>
            )}
          </div>

          {featured.progress > 0 && (
            <div className="mt-6 max-w-xs">
              <div className="h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: `${featured.progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-ink/50">
                {featured.progress}% дууссан
              </p>
            </div>
          )}
        </div>

        <div className="hidden h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl border border-white bg-white shadow-sm md:flex md:items-center md:justify-center">
          {featured.course.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.course.thumbnail_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <BookIcon className="h-16 w-16 text-brand-500/40" />
          )}
        </div>
      </section>

      <div className="mt-8 flex items-center gap-4 rounded-lg border border-ink/10 bg-white p-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-xl font-bold text-white">
          {level}
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-ink">Level {level}</p>
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

      {rest.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-bold text-ink">
            Миний сургалтууд
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map(({ course, progress, durationSeconds }, i) => (
              <CourseCard
                key={course.id}
                slug={course.slug}
                title={course.title}
                thumbnailUrl={course.thumbnail_url}
                durationSeconds={durationSeconds}
                progress={progress}
                tintIndex={i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
