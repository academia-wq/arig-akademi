import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { computeCourseProgress, mostCommonCategory } from "@/lib/course-progress";
import { getCourseIcon } from "@/lib/course-icon";
import { initialsOf } from "@/lib/format";
import { AdminTabs } from "@/components/admin-tabs";
import { ArrowRightIcon } from "@/components/icons";

export default async function LearnCoursesPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/learn");

  const [{ data: profile }, { data: enrollments }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("course_id, courses(id, title, slug, description, thumbnail_url, modules(id, category))")
      .eq("user_id", user.id),
  ]);

  let courses = (enrollments || []).map((e: any) => e.courses).filter(Boolean);

  // Хэрэглэгч ямар ч курст элсээгүй бол одоо байгаа үнэгүй курсуудад
  // автоматаар элсүүлнэ.
  if (courses.length === 0) {
    const { data: freeCourses } = await supabase
      .from("courses")
      .select("id, title, slug, description, thumbnail_url, modules(id, category)")
      .eq("is_published", true)
      .eq("price", 0);

    if (freeCourses && freeCourses.length > 0) {
      await supabase
        .from("enrollments")
        .upsert(
          freeCourses.map((c) => ({ user_id: user.id, course_id: c.id })),
          { onConflict: "user_id,course_id", ignoreDuplicates: true }
        );
      courses = freeCourses;
    }
  }

  const coursesWithProgress = await Promise.all(
    courses.map((course: any) => computeCourseProgress(supabase, user.id, course))
  );

  const activeCourses = coursesWithProgress.filter((c) => c.progress < 100);
  const doneCourses = coursesWithProgress.filter((c) => c.progress >= 100);

  const { data: newlyAddedCourses } = await supabase
    .from("courses")
    .select("id, title, slug, thumbnail_url, instructor_id")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  // Сурагч бусдын profile-г RLS-ээр харж чадахгүй тул зөвхөн багшийн нэр,
  // зургийг (full_name, avatar_url) service role-оор нарийн сонгож авна.
  const instructorIds = Array.from(
    new Set((newlyAddedCourses || []).map((c) => c.instructor_id).filter(Boolean))
  ) as string[];
  const { data: instructorRows } = instructorIds.length
    ? await createServiceRoleClient()
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", instructorIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };
  const instructorById = new Map((instructorRows || []).map((p) => [p.id, p]));

  const newlyAdded = await Promise.all(
    (newlyAddedCourses || []).map(async (course) => {
      const { totalLessons } = await computeCourseProgress(supabase, user.id, course);
      return {
        ...course,
        totalLessons,
        instructor: course.instructor_id ? instructorById.get(course.instructor_id) : undefined,
      };
    })
  );

  const featured =
    activeCourses.find((c) => c.progress > 0) || activeCourses[0] || doneCourses[0];

  const firstName = (profile?.full_name || "").trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Тавтай морил, ${firstName}!` : "Тавтай морил!";
  const bannerMessage = featured
    ? featured.progress >= 100
      ? `Баяр хүргэе! Та "${featured.course.title}" сургалтыг амжилттай дуусгалаа.`
      : featured.progress > 0
      ? `Та "${featured.course.title}" сургалтыг ${featured.progress}% дуусгасан байна. Үргэлжлүүлээрэй!`
      : `"${featured.course.title}" сургалт танд бэлэн байна. Өнөөдрөөс эхлээрэй!`
    : "Танд одоогоор идэвхтэй сургалт байхгүй байна.";

  function CourseRows({
    entries,
    done,
  }: {
    entries: typeof coursesWithProgress;
    done: boolean;
  }) {
    return (
      <div className="flex flex-col gap-6">
        {entries.map(({ course, progress, totalLessons, completedLessons }: any) => {
          const category = mostCommonCategory(course.modules);
          const { tint, illustration, icon: TopicIcon, tone } = getCourseIcon(course.title);
          return (
            <div
              key={course.id}
              className="flex flex-col gap-4 rounded-2xl border border-[#D9D9D9] bg-white py-[15px] pl-[15px] pr-6 sm:flex-row sm:gap-[18px]"
            >
              <div
                className={`flex h-[116px] w-[116px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                  course.thumbnail_url ? "bg-ink/5" : tint
                }`}
              >
                {course.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : illustration ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={illustration} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <TopicIcon className={`h-10 w-10 ${tone}`} />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="h-[22px]">
                  {category && (
                    <span className="inline-block rounded bg-brand-500 px-2 py-[3px] text-xs font-medium uppercase leading-4 text-ink">
                      {category}
                    </span>
                  )}
                </div>
                <p className="mt-[19px] text-base leading-6 text-ink">{course.title}</p>
                <div className="mt-auto h-2 rounded-full bg-[#D9D9D9] p-px">
                  <div
                    className="h-full rounded-full bg-[#F87B4F]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-shrink-0 flex-col items-start sm:box-content sm:w-[152px] sm:items-end sm:pl-[13px]">
                <p className="text-[28px] leading-9 text-ink">{progress}%</p>
                <p className="mt-1.5 text-xs text-[#8A9DA2]">
                  {completedLessons}/{totalLessons} хичээл
                </p>
                <Link
                  prefetch={false}
                  href={`/learn/${course.slug}`}
                  className={`focus-ring mt-4 flex h-[37px] w-[152px] items-center justify-center rounded-[7.5px] text-sm font-medium transition sm:mt-auto ${
                    done
                      ? "border border-[#8A9DA2] bg-paper text-[#8A9DA2] hover:border-ink hover:text-ink"
                      : "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)] hover:bg-brand-700"
                  }`}
                >
                  {done ? "Дахин үзэх" : "Үргэлжлүүлэх"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand-500 bg-paper p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-base text-brand-500">{greeting}</p>
          <p className="mt-1 text-sm text-ink/50">{bannerMessage}</p>
        </div>
        {featured && (
          <Link
            prefetch={false}
            href={`/learn/${featured.course.slug}`}
            className="focus-ring flex flex-shrink-0 items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] hover:bg-brand-700"
          >
            {featured.progress >= 100
              ? "Дахин үзэх"
              : featured.progress > 0
              ? "Үргэлжлүүлэх"
              : "Суралцаж эхлэх"}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="mt-6">
        {coursesWithProgress.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-ink/60">Та одоогоор ямар ч сургалтад элсээгүй байна.</p>
            <Link
              prefetch={false}
              href="/dashboard"
              className="focus-ring mt-4 inline-block font-medium text-brand-500"
            >
              Нүүр рүү буцах →
            </Link>
          </div>
        ) : (
          <AdminTabs
            tabs={[
              {
                label: "Идэвхтэй",
                content: (
                  activeCourses.length === 0 ? (
                    <p className="text-sm text-ink/50">Идэвхтэй сургалт алга байна.</p>
                  ) : (
                    <CourseRows entries={activeCourses} done={false} />
                  )
                ),
              },
              {
                label: "Дууссан",
                content: (
                  doneCourses.length === 0 ? (
                    <p className="text-sm text-ink/50">Дуусгасан сургалт алга байна.</p>
                  ) : (
                    <CourseRows entries={doneCourses} done={true} />
                  )
                ),
              },
            ]}
          />
        )}
      </div>

      {newlyAdded.length > 0 && (
        <div className="mt-8">
          <p className="text-ink">Шинээр нэмэгдсэн</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newlyAdded.map((course) => (
              <Link
                prefetch={false}
                key={course.id}
                href={`/learn/${course.slug}`}
                className="focus-ring group flex flex-col overflow-hidden rounded-2xl border border-[#F87B4F] bg-paper transition hover:shadow-md"
              >
                <div className="relative flex h-[140px] flex-shrink-0 items-center justify-center overflow-hidden bg-brand-500">
                  {course.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-multiply"
                    />
                  )}
                  <p className="relative px-6 text-center text-lg font-semibold text-paper">
                    {course.title}
                  </p>
                </div>
                <div className="flex flex-1 flex-col px-5 pb-5">
                  <div className="relative z-10 -mt-8 flex items-center gap-3">
                    <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FEF8F1] font-display text-sm font-semibold text-brand-700 ring-4 ring-paper">
                      {course.instructor?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.instructor.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initialsOf(course.instructor?.full_name ?? null, null)
                      )}
                    </span>
                    <p className="mt-8 text-xs text-[#8A9DA2]">
                      {course.instructor?.full_name || "Ариг Академи"}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-ink/40">{course.totalLessons} хичээл</p>
                  <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-500">
                    Дэлгэрэнгүй
                    <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
