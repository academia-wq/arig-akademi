import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { computeCourseProgress, getLastCompletedDatesByCourse } from "@/lib/course-progress";
import { formatDuration, formatJoinDate, formatCompletedDate, initialsOf } from "@/lib/format";
import { MailIcon, CalendarIcon } from "@/components/icons";

async function updateProfile(formData: FormData) {
  "use server";

  const supabase = createClient();
  const user = await getUser();
  if (!user) return;

  const fullName = formData.get("full_name") as string;
  const position = formData.get("position") as string;

  await supabase
    .from("profiles")
    .update({ full_name: fullName, position })
    .eq("id", user.id);

  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, position, avatar_url, role, created_at")
    .eq("id", user.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, slug)")
    .eq("user_id", user.id);

  const courses = (enrollments || []).map((e: any) => e.courses).filter(Boolean);
  const coursesWithProgress = await Promise.all(
    courses.map((course: any) => computeCourseProgress(supabase, user.id, course))
  );

  const totalCourses = coursesWithProgress.length;
  const completedCourses = coursesWithProgress.filter((c) => c.progress >= 100);
  const inProgressCourses = coursesWithProgress.filter(
    (c) => c.progress > 0 && c.progress < 100
  ).length;
  const overallPercent =
    totalCourses > 0 ? Math.round((completedCourses.length / totalCourses) * 100) : 0;

  const { data: completedLessonRows } = await supabase
    .from("lesson_progress")
    .select("completed_at, lessons(duration_seconds, modules(course_id))")
    .eq("user_id", user.id)
    .eq("is_completed", true);

  const studiedSeconds = (completedLessonRows || []).reduce(
    (sum: number, row: any) => sum + (row.lessons?.duration_seconds || 0),
    0
  );

  const lastCompletedAtByCourse = await getLastCompletedDatesByCourse(supabase, user.id);

  const initials = initialsOf(profile?.full_name ?? null, user.email ?? null);

  return (
    <div>
      {totalCourses > 0 && (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand-500 bg-paper p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-base text-brand-500">Сургалтын ахиц, үе шат</p>
            <p className="mt-1 text-xs text-ink/50">
              Та нийт {totalCourses} сургалтаас {completedCourses.length}-ыг нь амжилттай
              дүүргэсэн байна. Гүйцэтгэлийн түвшин: {overallPercent}%.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <p className="text-xs text-brand-500">{overallPercent}% Complete</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-ink/15 bg-white p-7 sm:flex-row sm:items-center">
        <div className="flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-50 font-display text-3xl font-semibold text-brand-700">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-semibold text-ink">
            {profile?.full_name || user.email}
          </p>
          <p className="text-ink/50">{profile?.position || "Ажилтан"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/50">
            <span className="flex items-center gap-1.5">
              <MailIcon className="h-4 w-4" />
              {user.email}
            </span>
            {profile?.created_at && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatJoinDate(profile.created_at)}
              </span>
            )}
          </div>

          <details className="mt-4 group">
            <summary className="focus-ring w-fit cursor-pointer text-sm font-medium text-brand-500">
              Профайл засах
            </summary>
            <form action={updateProfile} className="mt-4 flex max-w-sm flex-col gap-3">
              <div>
                <label className="block text-sm text-ink" htmlFor="full_name">
                  Бүтэн нэр
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile?.full_name ?? ""}
                  className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-ink" htmlFor="position">
                  Албан тушаал
                </label>
                <input
                  id="position"
                  name="position"
                  defaultValue={profile?.position ?? ""}
                  className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="focus-ring w-fit rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Хадгалах
              </button>
            </form>
          </details>
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
            {completedCourses.map(({ course, progress }) => {
              const completedAt = lastCompletedAtByCourse.get(course.id);
              return (
                <div
                  key={course.id}
                  className="flex items-center justify-between border-b border-ink/10 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{course.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      {completedAt && (
                        <span className="text-ink/50">
                          Дууссан: {formatCompletedDate(completedAt)}
                        </span>
                      )}
                      <span className="text-brand-500">Оноо: {progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
