import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { formatDuration, formatRelativeTime } from "@/lib/format";
import { AdminTabs } from "@/components/admin-tabs";
import { AdminEmployeeList } from "@/components/admin-employee-list";
import { AddEmployeeButton } from "@/components/add-employee-modal";
import { AddCourseButton } from "@/components/add-course-modal";
import { AwardIcon, BookIcon, DownloadIcon, EditIcon, UsersIcon } from "@/components/icons";

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
    admin.from("enrollments").select("user_id, course_id, enrolled_at"),
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

  const employeeList = (profiles || []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById.get(p.id) || "",
    position: p.position,
    department: p.department,
    avatar_url: p.avatar_url,
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
  const nameOf = (userId: string) =>
    profileById.get(userId)?.full_name || emailById.get(userId) || "Нэргүй хэрэглэгч";

  const recentActivity = [
    ...(profiles || []).map((p) => ({
      id: `p-${p.id}`,
      at: p.created_at,
      text: `${nameOf(p.id)} шинэ ажилтнаар нэмэгдлээ`,
    })),
    ...(enrollments || []).map((e) => ({
      id: `e-${e.user_id}-${e.course_id}`,
      at: e.enrolled_at,
      text: `${nameOf(e.user_id)} "${courseById.get(e.course_id)?.title || "сургалт"}" сургалтад элслээ`,
    })),
  ]
    .filter((e) => e.at)
    .sort((a, b) => (b.at as string).localeCompare(a.at as string))
    .slice(0, 5)
    .map((e) => ({ id: e.id, text: e.text, time: formatRelativeTime(e.at as string) }));

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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Нийт ажилтан", value: profiles?.length || 0, icon: UsersIcon },
          { label: "Нийт сургалт", value: courses?.length || 0, icon: BookIcon },
          { label: "Гэрчилгээнүүд", value: certificatesEarned, icon: AwardIcon },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="relative flex items-center gap-[18px] rounded-2xl border border-[#D9D9D9] bg-white px-6 py-[28px]"
          >
            <span className="flex h-[47px] w-[47px] flex-shrink-0 items-center justify-center border border-brand-500 text-brand-500">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="mt-1 text-[28px] leading-9 text-ink">{value}</p>
            </div>
            <span className="absolute right-5 top-[22px] h-2.5 w-2.5 rounded-full bg-brand-500" />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <AdminTabs
          tabs={[
            {
              label: "Тойм",
              content: (
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                  <p className="text-ink">Сүүлийн үйл явдал</p>
                  <div className="mt-4 flex flex-col">
                    {recentActivity.length === 0 && (
                      <p className="py-4 text-sm text-ink/50">Одоогоор үйл явдал алга байна.</p>
                    )}
                    {recentActivity.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-4 border-b border-ink/10 py-3 text-sm last:border-0"
                      >
                        <p className="text-ink">{a.text}</p>
                        <p className="flex-shrink-0 text-[#8A9DA2]">{a.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              label: "Ажилтан",
              content: <AdminEmployeeList employees={employeeList} />,
            },
            {
              label: "Сургалт",
              content: (
                <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
                  <div className="flex items-center justify-between p-6 pb-0">
                    <p className="text-ink">Нийт сургалт</p>
                    <Link
                      prefetch={false}
                      href="/admin/courses"
                      className="focus-ring text-sm font-medium text-brand-500"
                    >
                      Бүгдийг харах
                    </Link>
                  </div>
                  <div className="mt-5 overflow-x-auto px-4 pb-4">
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
          ]}
        />
      </div>
    </div>
  );
}