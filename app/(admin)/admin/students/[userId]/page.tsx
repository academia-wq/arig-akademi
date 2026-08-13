import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { computeLevel } from "@/lib/gamification";

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
    .select("id, full_name, role, position, created_at")
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
  const { level, lessonsIntoLevel, lessonsToNextLevel } = computeLevel(totalCompleted);

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

      return { course, modules: sortedModules, completedCount, total, percent };
    })
  );

  return (
    <div>
      <Link
        prefetch={false}
        href="/admin/students"
        className="focus-ring text-sm text-ink/50 hover:underline"
      >
        ← Ажилтнууд руу буцах
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-xl font-semibold text-white">
          {level}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {profile.full_name || email}
          </h1>
          <p className="text-sm text-ink/60">
            {email} · {profile.role}
            {profile.position ? ` · ${profile.position}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-ink/10 bg-white p-4">
        <p className="text-sm text-ink/70">
          Нийт <strong>{totalCompleted}</strong> хичээл дуусгасан — Level {level} (
          {lessonsIntoLevel}/10, дараагийн level хүртэл {lessonsToNextLevel} хичээл)
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {courses.length === 0 && (
          <p className="text-sm text-ink/50">Энэ хэрэглэгч ямар ч курст элсээгүй байна.</p>
        )}
        {courses.map(({ course, modules, completedCount, total, percent }) => (
          <div key={course.id} className="rounded-lg border border-ink/10 bg-white p-4">
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
