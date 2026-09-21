import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { formatDuration, initialsOf } from "@/lib/format";
import { AdminStatTabs } from "@/components/admin-stat-tabs";
import { AddEmployeeButton } from "@/components/add-employee-modal";
import { AddCourseButton } from "@/components/add-course-modal";
import { DownloadIcon, EditIcon } from "@/components/icons";

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isStaff = myProfile?.role === "admin" || myProfile?.role === "instructor";
  if (!isStaff) redirect("/dashboard");

  const admin = createServiceRoleClient();

  const [
    { data: profiles },
    { data: courses },
    { data: authUsers },
    { data: enrollments },
    { data: lessons },
    { data: completedRows },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, role, position, department, avatar_url, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("courses")
      .select("id, title, is_published, price, thumbnail_url, instructor_id, created_at")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("enrollments").select("user_id, course_id"),
    admin.from("lessons").select("id, duration_seconds, modules!inner(course_id)"),
    admin.from("lesson_progress").select("user_id, lesson_id").eq("is_completed", true),
  ]);

  const emailById = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));
  const courseIdByLesson = new Map((lessons || []).map((l: any) => [l.id, l.modules.course_id]));
  const totalLessonsByCourse = new Map<string, number>();
  const totalDurationByCourse = new Map<string, number>();
  for (const l of lessons || []) {
    const courseId = (l as any).modules.course_id;
    totalLessonsByCourse.set(courseId, (totalLessonsByCourse.get(courseId) || 0) + 1);
    totalDurationByCourse.set(
      courseId,
      (totalDurationByCourse.get(courseId) || 0) + ((l as any).duration_seconds || 0)
    );
  }
  const profileById = new Map((profiles || []).map((p) => [p.id, p]));

  const completedByUserCourse = new Map<string, number>();
  for (const row of completedRows || []) {
    const courseId = courseIdByLesson.get(row.lesson_id);
    if (!courseId) continue;
    const key = `${row.user_id}:${courseId}`;
    completedByUserCourse.set(key, (completedByUserCourse.get(key) || 0) + 1);
  }

  let certificatesEarned = 0;
  for (const e of enrollments || []) {
    const total = totalLessonsByCourse.get(e.course_id) || 0;
    const completed = completedByUserCourse.get(`${e.user_id}:${e.course_id}`) || 0;
    if (total > 0 && completed >= total) certificatesEarned++;
  }

  const employeePreview = (profiles || []).slice(0, 6).map((p) => ({
    ...p,
    email: emailById.get(p.id) || "",
  }));

  const coursePreview = (courses || []).slice(0, 6);

  const pendingProfiles = (profiles || [])
    .filter((p) => !p.position)
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailById.get(p.id) || "",
    }));

  const courseOptions = (courses || []).map((c) => ({ id: c.id, title: c.title }));

  const courseById = new Map((courses || []).map((c) => [c.id, c]));
  const certificateRows = (enrollments || [])
    .filter((e) => {
      const total = totalLessonsByCourse.get(e.course_id) || 0;
      const completed = completedByUserCourse.get(`${e.user_id}:${e.course_id}`) || 0;
      return total > 0 && completed >= total;
    })
    .map((e) => {
      const person = profileById.get(e.user_id);
      return {
        id: `${e.user_id}-${e.course_id}`,
        name: person?.full_name || emailById.get(e.user_id) || "Нэргүй хэрэглэгч",
        courseTitle: courseById.get(e.course_id)?.title || "Сургалт",
      };
    })
    .slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-500 bg-paper p-5">
        <div>
          <p className="text-base text-brand-500">Удирдлагын самбар</p>
          <p className="mt-1 text-ink">Админ панель</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AddEmployeeButton pendingProfiles={pendingProfiles} />
          <AddCourseButton courses={courseOptions} />
          <button
            type="button"
            className="focus-ring flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)] hover:bg-brand-700"
          >
            Тайлан
            <DownloadIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <AdminStatTabs
          tabs={[
            {
              label: "Нийт ажилтан",
              value: profiles?.length || 0,
              content: (
                <div className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
                  <div className="flex items-center justify-end p-6 pb-0">
                    <Link
                      prefetch={false}
                      href="/admin/students"
                      className="focus-ring text-sm font-medium text-brand-500"
                    >
                      Бүгдийг харах
                    </Link>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-brand-500 text-xs uppercase text-paper">
                        <th className="px-4 py-3 font-medium">Ажилтны нэр</th>
                        <th className="px-4 py-3 text-center font-medium">Имэйл</th>
                        <th className="px-4 py-3 text-center font-medium">Албан тушаал</th>
                        <th className="px-4 py-3 text-center font-medium">Хэлтэс</th>
                        <th className="px-4 py-3 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeePreview.map((p) => (
                        <tr key={p.id} className="border-b border-ink/10 last:border-0">
                          <td className="px-4 py-4 text-sm font-medium text-ink">
                            <Link
                              prefetch={false}
                              href={`/admin/students/${p.id}`}
                              className="flex items-center gap-3 hover:text-brand-500"
                            >
                              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-brand-50 font-display text-sm font-semibold text-brand-700">
                                {p.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.avatar_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  initialsOf(p.full_name, p.email)
                                )}
                              </span>
                              {p.full_name || "Нэргүй"}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-ink/50">
                            {p.email}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-ink/50">
                            {p.position || "—"}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-ink/50">
                            {p.department || "—"}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link
                              prefetch={false}
                              href={`/admin/students/${p.id}`}
                              aria-label="Засах"
                              className="focus-ring inline-flex text-ink/40 hover:text-brand-500"
                            >
                              <EditIcon className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {employeePreview.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/50">
                            Ажилтан алга байна.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              ),
            },
            {
              label: "Нийт сургалт",
              value: courses?.length || 0,
              content: (
                <div className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
                  <div className="flex items-center justify-end p-6 pb-0">
                    <Link
                      prefetch={false}
                      href="/admin/courses"
                      className="focus-ring text-sm font-medium text-brand-500"
                    >
                      Бүгдийг харах
                    </Link>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-brand-500 text-xs uppercase text-paper">
                          <th className="px-4 py-3 font-medium">Сургалтын нэр</th>
                          <th className="px-4 py-3 text-center font-medium">Төлөв</th>
                          <th className="px-4 py-3 text-center font-medium">Үнэ</th>
                          <th className="px-4 py-3 text-right font-medium">Нийт хичээл</th>
                          <th className="px-4 py-3 text-right font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {coursePreview.map((c: any) => {
                          const instructor = profileById.get(c.instructor_id);
                          const duration = formatDuration(totalDurationByCourse.get(c.id) || 0);
                          return (
                            <tr key={c.id} className="border-b border-ink/10 last:border-0">
                              <td className="px-4 py-4">
                                <Link
                                  prefetch={false}
                                  href={`/admin/courses/${c.id}/edit`}
                                  className="flex items-center gap-3 hover:text-brand-500"
                                >
                                  <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-ink/5">
                                    {c.thumbnail_url && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={c.thumbnail_url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    )}
                                  </span>
                                  <span>
                                    <span className="block text-sm font-medium text-ink">
                                      {c.title}
                                    </span>
                                    <span className="block text-xs text-ink/50">
                                      {instructor?.full_name || "Багш тодорхойгүй"}
                                      {duration ? ` · Нийт цаг | ${duration}` : ""}
                                    </span>
                                  </span>
                                </Link>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span
                                  className={
                                    c.is_published
                                      ? "rounded-sm bg-accent/20 px-2 py-0.5 text-xs text-emerald-700"
                                      : "rounded-sm bg-ink/10 px-2 py-0.5 text-xs text-ink/50"
                                  }
                                >
                                  {c.is_published ? "Нийтэлсэн" : "Ноорог"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-ink/50">
                                {c.price > 0 ? `${c.price}₮` : "Үнэгүй"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-ink/50">
                                {totalLessonsByCourse.get(c.id) || 0}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Link
                                  prefetch={false}
                                  href={`/admin/courses/${c.id}/edit`}
                                  aria-label="Засах"
                                  className="focus-ring inline-flex text-ink/40 hover:text-brand-500"
                                >
                                  <EditIcon className="h-4 w-4" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                        {coursePreview.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/50">
                              Сургалт алга байна.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
            },
            {
              label: "Гэрчилгээнүүд",
              value: certificatesEarned,
              content: (
                <div className="rounded-2xl border border-ink/15 bg-white p-6">
                  <p className="text-ink">Сүүлд авсан гэрчилгээнүүд</p>
                  <div className="mt-5 flex flex-col gap-3">
                    {certificateRows.length === 0 && (
                      <p className="text-sm text-ink/50">Одоогоор гэрчилгээ авсан хэрэглэгч алга байна.</p>
                    )}
                    {certificateRows.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between border-b border-ink/10 pb-2 text-sm last:border-0"
                      >
                        <p className="font-medium text-ink">{row.name}</p>
                        <p className="flex-shrink-0 text-ink/50">{row.courseTitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
