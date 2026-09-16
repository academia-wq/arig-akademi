import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { formatDuration, initialsOf } from "@/lib/format";
import { AdminTabs } from "@/components/admin-tabs";
import { DownloadIcon, EditIcon, PlusIcon } from "@/components/icons";

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

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, position, avatar_url, created_at")
    .order("created_at", { ascending: false });

  const { data: courses } = await admin
    .from("courses")
    .select("id, title, is_published, price, thumbnail_url, instructor_id, created_at")
    .order("created_at", { ascending: false });

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));

  const { data: enrollments } = await admin
    .from("enrollments")
    .select("user_id, course_id");

  const { data: lessons } = await admin
    .from("lessons")
    .select("id, duration_seconds, modules!inner(course_id)");
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

  const { data: completedRows } = await admin
    .from("lesson_progress")
    .select("user_id, lesson_id")
    .eq("is_completed", true);

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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-500 bg-paper p-5">
        <div>
          <p className="text-base text-brand-500">Удирдлагын самбар</p>
          <p className="mt-1 text-ink">Админ панель</p>
        </div>
        <button
          type="button"
          className="focus-ring flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)] hover:bg-brand-700"
        >
          Тайлан
          <DownloadIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <p className="text-sm font-medium text-ink">Нийт ажилтан</p>
          <p className="mt-2 text-[28px] leading-9 text-ink">{profiles?.length || 0}</p>
        </div>
        <Link
          prefetch={false}
          href="/admin/courses"
          className="focus-ring rounded-2xl bg-brand-500 p-5 transition hover:bg-brand-700"
        >
          <p className="text-sm font-medium text-paper">Нийт сургалт</p>
          <p className="mt-2 text-[28px] leading-9 text-paper">{courses?.length || 0}</p>
        </Link>
        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <p className="text-sm font-medium text-ink">Гэрчилгээнүүд</p>
          <p className="mt-2 text-[28px] leading-9 text-ink">{certificatesEarned}</p>
        </div>
      </div>

      <div className="mt-6">
        <AdminTabs
          tabs={[
            {
              label: "Тойм",
              content: (
                <div className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
                  <div className="p-6 pb-0">
                    <p className="text-ink">Нийт сургалт</p>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-brand-500 text-xs uppercase text-paper">
                          <th className="px-4 py-3 font-medium">Сургалтын нэр</th>
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
                            <td colSpan={3} className="px-4 py-8 text-center text-sm text-ink/50">
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
              label: "Ажилтан",
              content: (
                <div className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
                  <div className="flex items-center justify-between p-6 pb-0">
                    <p className="text-ink">Нийт ажилтан</p>
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
                        <th className="px-4 py-3 text-right font-medium">Эрх</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeePreview.map((p) => (
                        <tr key={p.id} className="border-b border-ink/10 last:border-0">
                          <td className="px-4 py-4 text-sm font-medium text-ink">
                            <Link
                              prefetch={false}
                              href={`/admin/students/${p.id}`}
                              className="focus-ring flex items-center gap-3 hover:text-brand-500"
                            >
                              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-500 bg-brand-50 font-display text-xs font-semibold text-brand-700">
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
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink/50">
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
              label: "Сургалт",
              content: (
                <div className="rounded-2xl border border-ink/15 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-ink">Нийт сургалт</p>
                    <div className="flex items-center gap-3">
                      <Link
                        prefetch={false}
                        href="/admin/courses"
                        className="focus-ring text-sm font-medium text-brand-500"
                      >
                        Бүгдийг харах
                      </Link>
                      <Link
                        prefetch={false}
                        href="/admin/courses"
                        className="focus-ring flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)] hover:bg-brand-700"
                      >
                        Сургалт нэмэх
                        <PlusIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {coursePreview.map((c) => (
                      <Link
                        prefetch={false}
                        key={c.id}
                        href={`/admin/courses/${c.id}/edit`}
                        className="focus-ring flex flex-col gap-2 rounded-xl border border-ink/15 p-4 transition hover:border-brand-300"
                      >
                        <p className="font-medium text-ink">{c.title}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={
                              c.is_published
                                ? "rounded-sm bg-accent/20 px-2 py-0.5 text-emerald-700"
                                : "rounded-sm bg-ink/10 px-2 py-0.5 text-ink/50"
                            }
                          >
                            {c.is_published ? "Нийтэлсэн" : "Ноорог"}
                          </span>
                          <span className="text-ink/50">
                            {c.price > 0 ? `${c.price}₮` : "Үнэгүй"}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {coursePreview.length === 0 && (
                      <p className="text-sm text-ink/50">Сургалт алга байна.</p>
                    )}
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
