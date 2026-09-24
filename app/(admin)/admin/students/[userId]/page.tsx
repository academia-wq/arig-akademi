import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { computeLevel } from "@/lib/gamification";
import { formatDuration, formatJoinDate, formatCompletedDate, initialsOf } from "@/lib/format";
import { MailIcon, CalendarIcon } from "@/components/icons";

export default async function StudentDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = createClient();
  const viewer = await getUser();
  if (!viewer) redirect(`/login?redirect=/admin/students/${params.userId}`);

  const admin = createServiceRoleClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, position, avatar_url, created_at")
    .eq("id", params.userId)
    .single();

  if (!profile) notFound();

  const { data: authUser } = await admin.auth.admin.getUserById(params.userId);
  const email = authUser?.user?.email || "";

  const { data: progressRows } = await admin
    .from("lesson_progress")
    .select("lesson_id, is_completed, completed_at")
    .eq("user_id", params.userId);

  const progressByLesson = new Map(
    (progressRows || []).map((p) => [p.lesson_id, p])
  );
  const totalCompleted = (progressRows || []).filter((p) => p.is_completed).length;
  const { level, lessonsIntoLevel, lessonsToNextLevel, progressPercent } =
    computeLevel(totalCompleted);

  const { data: completedLessonRows } = await admin
    .from("lesson_progress")
    .select("completed_at, lessons(duration_seconds, modules(course_id))")
    .eq("user_id", params.userId)
    .eq("is_completed", true);

  const studiedSeconds = (completedLessonRows || []).reduce(
    (sum: number, row: any) => sum + (row.lessons?.duration_seconds || 0),
    0
  );

  const { data: enrollments } = await admin
    .from("enrollments")
    .select("course_id, courses(id, title, slug)")
    .eq("user_id", params.userId);

  const courses = await Promise.all(
    (enrollments || []).map(async (e: any) => {
      const course = e.courses;
      const { data: modules } = await admin
        .from("modules")
        .select("id, title, position, lessons(id, title, position)")
        .eq("course_id", course.id)
        .order("position");

      const sortedModules = (modules || [])
        .map((m: any) => ({
          ...m,
          lessons: (m.lessons || []).sort((a: any, b: any) => a.position - b.position),
        }))
        .sort((a: any, b: any) => a.position - b.position);

      const allLessons = sortedModules.flatMap((m: any) => m.lessons);
      const completedCount = allLessons.filter(
        (l: any) => progressByLesson.get(l.id)?.is_completed
      ).length;
      const total = allLessons.length;
      const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      let lastCompletedAt: string | null = null;
      for (const lesson of allLessons) {
        const completedAt = progressByLesson.get(lesson.id)?.completed_at;
        if (completedAt && (!lastCompletedAt || completedAt > lastCompletedAt)) {
          lastCompletedAt = completedAt;
        }
      }

      return { course, modules: sortedModules, completedCount, total, percent, lastCompletedAt };
    })
  );

  const totalCourses = courses.length;
  const completedCourses = courses.filter((c) => c.total > 0 && c.percent >= 100);
  const inProgressCourses = courses.filter((c) => c.percent > 0 && c.percent < 100).length;

  const initials = initialsOf(profile.full_name ?? null, email);

  return (
    <div>
      <Link
        prefetch={false}
        href="/admin/students"
        className="focus-ring text-sm text-ink/50 hover:underline"
      >
        ← Ажилтнууд руу буцах
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-brand-500 bg-paper p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-base text-brand-500">Сургалтын ахиц, үе шат</p>
          <p className="mt-1 text-xs text-ink/50">
            Нийт <strong>{totalCompleted}</strong> хичээл дуусгасан — Level {level} (
            {lessonsIntoLevel}/10, дараагийн level хүртэл {lessonsToNextLevel} хичээл).
          </p>
        </div>
        <div className="w-full sm:w-80">
          <p className="text-xs text-brand-500">{progressPercent}% Complete</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-ink/15 bg-white p-7 sm:flex-row sm:items-center">
        <div className="flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-50 font-display text-3xl font-semibold text-brand-700">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-semibold text-ink">
            {profile.full_name || email}
          </p>
          <p className="text-ink/50">
            {profile.position || (profile.role === "admin" ? "Админ" : "Ажилтан")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/50">
            <span className="flex items-center gap-1.5">
              <MailIcon className="h-4 w-4" />
              {email}
            </span>
            {profile.created_at && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatJoinDate(profile.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/15 bg-white p-6">
          <p className="text-ink">Сургалтын статистик</p>
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <p className="text-sm font-medium text-ink/50">Нийт сургалт</p>
              <p className="text-ink">{totalCourses}</p>
            </div>
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <p className="text-sm font-medium text-ink/50">Дуусгасан</p>
              <p className="text-emerald-600">{completedCourses.length}</p>
            </div>
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <p className="text-sm font-medium text-ink/50">Явагдаж буй</p>
              <p className="text-brand-500">{inProgressCourses}</p>
            </div>
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <p className="text-sm font-medium text-ink/50">Суралцсан цаг</p>
              <p className="text-ink">{formatDuration(studiedSeconds) || "0 мин"}</p>
            </div>
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <p className="text-sm font-medium text-ink/50">Гэрчилгээ</p>
              <p className="text-violet-600">{completedCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/15 bg-white p-6">
          <p className="text-ink">Дуусгасан сургалтууд</p>
          <div className="mt-5 flex flex-col gap-3">
            {completedCourses.length === 0 && (
              <p className="text-sm text-ink/50">Одоогоор дуусгасан сургалт байхгүй байна.</p>
            )}
            {completedCourses.map(({ course, percent, lastCompletedAt }) => (
              <div
                key={course.id}
                className="flex items-center justify-between border-b border-ink/10 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{course.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    {lastCompletedAt && (
                      <span className="text-ink/50">
                        Дууссан: {formatCompletedDate(lastCompletedAt)}
                      </span>
                    )}
                    <span className="text-brand-500">Оноо: {percent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {courses.length === 0 && (
          <p className="text-sm text-ink/50">Энэ хэрэглэгч ямар ч курст элсээгүй байна.</p>
        )}
        {courses.map(({ course, modules, completedCount, total, percent }) => (
          <div key={course.id} className="rounded-2xl border border-ink/15 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-ink">{course.title}</h2>
              <span className="text-sm text-ink/60">
                {completedCount}/{total} хичээл ({percent}%)
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-ink/5">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-4 space-y-4">
              {modules.map((mod: any) => (
                <div key={mod.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                    {mod.title}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {mod.lessons.map((lesson: any) => {
                      const done = progressByLesson.get(lesson.id)?.is_completed;
                      const completedAt = progressByLesson.get(lesson.id)?.completed_at;
                      return (
                        <li
                          key={lesson.id}
                          className="flex items-center gap-2 text-sm text-ink/70"
                        >
                          <span
                            className={
                              done
                                ? "h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent"
                                : "h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink/20"
                            }
                          />
                          <span className={done ? "text-ink" : ""}>{lesson.title}</span>
                          {done && completedAt && (
                            <span className="text-xs text-ink/40">
                              {new Date(completedAt).toLocaleDateString("mn-MN")}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
