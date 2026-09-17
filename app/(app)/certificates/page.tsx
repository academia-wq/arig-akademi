import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  computeCourseProgress,
  getLastCompletedDatesByCourse,
  mostCommonCategory,
} from "@/lib/course-progress";
import { formatCompletedDate } from "@/lib/format";
import { getCourseIcon } from "@/lib/course-icon";
import { AwardIcon, ArrowRightIcon } from "@/components/icons";

export default async function CertificatesPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/certificates");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, slug, thumbnail_url, modules(id, category))")
    .eq("user_id", user.id);

  const courses = (enrollments || []).map((e: any) => e.courses).filter(Boolean);
  const coursesWithProgress = await Promise.all(
    courses.map((course: any) => computeCourseProgress(supabase, user.id, course))
  );

  const totalCourses = coursesWithProgress.length;
  const completedCourses = coursesWithProgress.filter((c) => c.progress >= 100);
  const inProgressCourses = coursesWithProgress.filter(
    (c) => c.progress > 0 && c.progress < 100
  );
  const overallPercent =
    totalCourses > 0
      ? Math.round((completedCourses.length / totalCourses) * 100)
      : 0;

  const lastCompletedAtByCourse = await getLastCompletedDatesByCourse(supabase, user.id);

  const now = new Date();
  const earnedThisMonth = completedCourses.filter((c) => {
    const date = lastCompletedAtByCourse.get(c.course.id);
    if (!date) return false;
    const d = new Date(date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const bannerMessage =
    totalCourses === 0
      ? "Та одоогоор ямар ч сургалтад элсээгүй байна."
      : overallPercent >= 50
      ? `Баяр хүргэе! Та суралцах зорилтынхоо ${overallPercent}%-ийг биелүүллээ.`
      : `Та одоогоор суралцах зорилтынхоо ${overallPercent}%-ийг биелүүлсэн байна. Үргэлжлүүлээрэй!`;

  return (
    <div>
      <div className="rounded-xl border border-brand-500 bg-paper p-5">
        <p className="text-base text-brand-500">{bannerMessage}</p>
        <p className="mt-1 text-sm text-ink/50">
          Мэргэжлийн түвшинд ур чадвараа баталгаажуулж, өөрийн гэрчилгээнүүдээ доорх хэсгээс
          үзээрэй.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Нийт гэрчилгээ</p>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                completedCourses.length > 0 ? "bg-brand-500" : "bg-ink/20"
              }`}
            />
          </div>
          <p className="mt-1.5 text-[28px] leading-9 text-ink">{completedCourses.length}</p>
          <p className="text-xs text-ink/40">Амжилттай дуусгасан</p>
        </div>
        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Энэ сард авсан</p>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                earnedThisMonth > 0 ? "bg-brand-500" : "bg-ink/20"
              }`}
            />
          </div>
          <p className="mt-1.5 text-[28px] leading-9 text-ink">{earnedThisMonth}</p>
          <p className="text-xs text-ink/40">Шинэ амжилтууд</p>
        </div>
        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Явагдаж буй</p>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                inProgressCourses.length > 0 ? "bg-brand-500" : "bg-ink/20"
              }`}
            />
          </div>
          <p className="mt-1.5 text-[28px] leading-9 text-ink">{inProgressCourses.length}</p>
          <p className="text-xs text-ink/40">Дуусгаагүй сургалт</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-ink">Миний гэрчилгээнүүд</p>
        {completedCourses.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">
            Одоогоор дуусгасан сургалт байхгүй тул гэрчилгээ гараагүй байна.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {completedCourses.map(({ course }) => {
              const completedAt = lastCompletedAtByCourse.get(course.id);
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-5 rounded-2xl border border-ink/15 bg-white p-5"
                >
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center border border-brand-500">
                    <AwardIcon className="h-8 w-8 text-brand-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{course.title}</p>
                    {completedAt && (
                      <p className="mt-1 text-xs text-ink/40">
                        {formatCompletedDate(completedAt)}-нд авсан
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-brand-500">Үнэлгээ: 100%</p>
                  </div>
                  <Link
                    prefetch={false}
                    href={`/learn/${course.slug}`}
                    className="focus-ring flex flex-shrink-0 items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Дэлгэрэнгүй
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {inProgressCourses.length > 0 && (
        <div className="mt-8">
          <p className="text-ink">Явагдаж буй сургалтууд</p>
          <div className="mt-4 flex flex-col gap-4">
            {inProgressCourses.map(({ course, progress, totalLessons, completedLessons }, i) => {
              const category = mostCommonCategory(course.modules);
              const { tint, illustration, icon: TopicIcon, tone } = getCourseIcon(
                course.title,
                i
              );
              return (
                <div
                  key={course.id}
                  className="flex flex-col gap-4 rounded-2xl border border-ink/15 bg-white p-5 sm:flex-row sm:items-center"
                >
                  <div
                    className={`flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                      course.thumbnail_url ? "bg-ink/5" : tint
                    }`}
                  >
                    {course.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : illustration ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={illustration}
                        alt=""
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <TopicIcon className={`h-8 w-8 ${tone}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {category && (
                      <span className="inline-block rounded bg-brand-500 px-2 py-0.5 text-xs font-medium uppercase text-white">
                        {category}
                      </span>
                    )}
                    <p className="mt-1.5 font-medium text-ink">{course.title}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink/40">
                      {completedLessons}/{totalLessons} хичээл
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <p className="text-2xl text-ink">{progress}%</p>
                    <Link
                      prefetch={false}
                      href={`/learn/${course.slug}`}
                      className="focus-ring rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Үргэлжлүүлэх
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
