import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { computeCourseProgress } from "@/lib/course-progress";
import { getCourseIcon } from "@/lib/course-icon";
import { formatDuration } from "@/lib/format";
import { AdminTabs } from "@/components/admin-tabs";
import { ArrowRightIcon, BrandMarkIcon, PlayCircleIcon } from "@/components/icons";

export default async function LearnCoursesPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/learn");

  const [{ data: profile }, { data: enrollments }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("course_id, courses(id, title, slug, description, thumbnail_url, instructor_id)")
      .eq("user_id", user.id),
  ]);

  let courses = (enrollments || []).map((e: any) => e.courses).filter(Boolean);

  // Хэрэглэгч ямар ч курст элсээгүй бол одоо байгаа үнэгүй курсуудад
  // автоматаар элсүүлнэ.
  if (courses.length === 0) {
    const { data: freeCourses } = await supabase
      .from("courses")
      .select("id, title, slug, description, thumbnail_url, instructor_id")
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

  // Сурагч бусдын profile-г RLS-ээр харж чадахгүй тул зөвхөн багшийн нэрийг
  // (full_name) service role-оор нарийн сонгож авна.
  const instructorIds = Array.from(
    new Set(courses.map((c: any) => c.instructor_id).filter(Boolean))
  ) as string[];
  const { data: instructorRows } = instructorIds.length
    ? await createServiceRoleClient()
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const instructorNameById = new Map(
    (instructorRows || []).map((p) => [p.id, p.full_name])
  );

  const enrolledIds = courses.map((c: any) => c.id);
  const { data: newlyAddedCourses } = await supabase
    .from("courses")
    .select("id, title, slug, thumbnail_url")
    .eq("is_published", true)
    .not("id", "in", `(${enrolledIds.length ? enrolledIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)
    .order("created_at", { ascending: false })
    .limit(3);

  const newlyAdded = await Promise.all(
    (newlyAddedCourses || []).map(async (course) => {
      const { totalLessons } = await computeCourseProgress(supabase, user.id, course);
      return { ...course, totalLessons };
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

  function CoursesTable({
    entries,
    done,
  }: {
    entries: typeof coursesWithProgress;
    done: boolean;
  }) {
    return (
      <div className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-500 text-xs uppercase text-paper">
                <th className="px-4 py-3 font-medium">Сургалтын нэр</th>
                <th className="px-4 py-3 text-center font-medium">Нийт хичээл</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ course, totalLessons, durationSeconds }: any) => {
                const { tint, illustration, icon: TopicIcon, tone } = getCourseIcon(course.title);
                const instructor = instructorNameById.get(course.instructor_id);
                const duration = formatDuration(durationSeconds);
                return (
                  <tr key={course.id} className="border-b border-ink/10 last:border-0">
                    <td className="px-4 py-4">
                      <Link
                        prefetch={false}
                        href={`/learn/${course.slug}`}
                        className="focus-ring flex items-center gap-3 hover:text-brand-500"
                      >
                        <span
                          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded ${
                            course.thumbnail_url ? "bg-ink/5" : tint
                          }`}
                        >
                          {course.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                          ) : illustration ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={illustration} alt="" className="h-full w-full object-contain p-1.5" />
                          ) : (
                            <TopicIcon className={`h-6 w-6 ${tone}`} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-ink">{course.title}</span>
                          {(instructor || duration) && (
                            <span className="block text-xs text-ink/50">
                              {instructor}
                              {instructor && duration ? " · " : ""}
                              {duration ? `Хичээлийн нийт цаг | ${duration}` : ""}
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-ink">{totalLessons}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        prefetch={false}
                        href={`/learn/${course.slug}`}
                        aria-label={done ? "Дахин үзэх" : "Үргэлжлүүлэх"}
                        className="focus-ring inline-flex text-brand-500 hover:text-brand-700"
                      >
                        <PlayCircleIcon className="h-6 w-6" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                    <CoursesTable entries={activeCourses} done={false} />
                  )
                ),
              },
              {
                label: "Дууссан",
                content: (
                  doneCourses.length === 0 ? (
                    <p className="text-sm text-ink/50">Дуусгасан сургалт алга байна.</p>
                  ) : (
                    <CoursesTable entries={doneCourses} done={true} />
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
                className="focus-ring group flex flex-col overflow-hidden rounded-2xl border border-brand-500 bg-paper transition hover:shadow-md"
              >
                <div className="h-24 flex-shrink-0 bg-brand-500" />
                <div className="flex flex-1 flex-col px-5 pb-5">
                  <div className="-mt-8 flex items-center gap-3">
                    {course.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnail_url}
                        alt=""
                        className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-4 ring-paper"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF8F1] ring-4 ring-paper">
                        <BrandMarkIcon className="h-8 w-8 text-ink" />
                      </div>
                    )}
                    <p className="mt-6 text-xs text-ink/40">Ариг Академи</p>
                  </div>
                  <p className="mt-3 font-medium text-ink">{course.title}</p>
                  <p className="mt-1 text-xs text-ink/40">{course.totalLessons} хичээл</p>
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
