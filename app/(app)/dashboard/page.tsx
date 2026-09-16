import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { computeCourseProgress } from "@/lib/course-progress";
import { formatMonthRange } from "@/lib/format";
import { UsersIcon, BookIcon, PlayIcon, CalendarIcon } from "@/components/icons";

const STATUS_STYLES: Record<string, string> = {
  Дуусгасан: "bg-brand-500 text-paper",
  "Үргэлжилж буй": "bg-paper text-brand-500",
  Шинэ: "bg-[#D2E38C] text-ink text-xs",
};

function statusOf(progress: number) {
  if (progress >= 100) return "Дуусгасан";
  if (progress === 0) return "Шинэ";
  return "Үргэлжилж буй";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, slug, description, thumbnail_url)")
    .eq("user_id", user.id);

  const courses = (enrollments || []).map((e: any) => e.courses).filter(Boolean);

  const coursesWithProgress = await Promise.all(
    courses.map((course: any) => computeCourseProgress(supabase, user.id, course))
  );

  if (coursesWithProgress.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Хяналтын самбар</h1>
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

  const completedCourses = coursesWithProgress.filter((c) => c.progress >= 100).length;
  const inProgressCourses = coursesWithProgress.filter(
    (c) => c.progress > 0 && c.progress < 100
  ).length;

  // Хичээлийн чиглэлээр (module.category) явцыг тооцоолох
  const courseIds = coursesWithProgress.map((c) => c.course.id);
  const { data: modules } = await supabase
    .from("modules")
    .select("id, category")
    .in("course_id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]);

  const moduleIds = (modules || []).map((m) => m.id);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, module_id")
    .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: completedLessonRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .in(
      "lesson_id",
      (lessons || []).length
        ? (lessons || []).map((l) => l.id)
        : ["00000000-0000-0000-0000-000000000000"]
    );
  const completedLessonIds = new Set((completedLessonRows || []).map((r) => r.lesson_id));

  const categoryByModule = new Map((modules || []).map((m) => [m.id, m.category || "Бусад"]));
  const categoryStats = new Map<string, { total: number; completed: number }>();
  for (const lesson of lessons || []) {
    const category = categoryByModule.get(lesson.module_id) || "Бусад";
    const entry = categoryStats.get(category) || { total: 0, completed: 0 };
    entry.total += 1;
    if (completedLessonIds.has(lesson.id)) entry.completed += 1;
    categoryStats.set(category, entry);
  }
  const departmentProgress = Array.from(categoryStats.entries())
    .map(([category, { total, completed }]) => ({
      category,
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-normal text-ink">Тойм</h1>
          <p className="mt-1 text-ink/50">
            Миний сургалтын явц, даалгавар болон үнэлгээний мэдээлэл.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5">
          <CalendarIcon className="h-3.5 w-3.5 text-ink" />
          <span className="text-sm font-medium text-ink">
            {formatMonthRange(new Date())}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-ink/15 bg-white p-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-brand-500">
            <UsersIcon className="h-[22px] w-[22px] text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink/50">Бүртгэлтэй сургалт</p>
            <p className="text-[28px] leading-9 text-ink">{coursesWithProgress.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-ink/15 bg-white p-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-brand-500">
            <BookIcon className="h-[22px] w-[22px] text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink/50">Дуусгасан сургалт</p>
            <p className="text-[28px] leading-9 text-ink">{completedCourses}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-ink/15 bg-white p-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-brand-500">
            <PlayIcon className="h-[22px] w-[22px] text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink/50">Явагдаж буй</p>
            <p className="text-[28px] leading-9 text-ink">{inProgressCourses}</p>
          </div>
        </div>
      </div>

      {departmentProgress.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink/15 bg-white p-6">
          <p className="text-ink">Хичээлийн чиглэлээр явц</p>
          <div className="mt-5 flex flex-col gap-4">
            {departmentProgress.map((d) => (
              <div key={d.category}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{d.category}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-ink/50">
                      {d.completed}/{d.total} дуусгасан
                    </p>
                    <p className="text-sm font-medium text-brand-500">{d.percent}%</p>
                  </div>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-ink/15 bg-white p-6">
        <p className="text-ink">Миний сургалтын явц</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-paper text-xs text-ink/50">
                <th className="px-4 py-3 font-normal">Сургалтын нэр</th>
                <th className="px-4 py-3 text-center font-normal">Нийт хичээл</th>
                <th className="px-4 py-3 text-center font-normal">Дуусгасан</th>
                <th className="px-4 py-3 text-center font-normal">Миний оноо</th>
                <th className="px-4 py-3 text-right font-normal">Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {coursesWithProgress.map(
                ({ course, progress, totalLessons, completedLessons }) => {
                  const status = statusOf(progress);
                  return (
                    <tr key={course.id} className="border-b border-ink/10 last:border-0">
                      <td className="px-4 py-4 text-sm font-medium text-ink">
                        <Link
                          prefetch={false}
                          href={`/learn/${course.slug}`}
                          className="focus-ring hover:text-brand-500"
                        >
                          {course.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-ink">
                        {totalLessons}
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-ink">
                        {completedLessons}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-brand-500">
                        {progress}%
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex rounded px-2 py-1 text-sm font-medium ${STATUS_STYLES[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
