import Link from "next/link";
import clsx from "clsx";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { computeLevel } from "@/lib/gamification";
import { StudentRowActions } from "@/components/student-row-actions";

export default async function AdminStudentsPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/admin/students");

  const admin = createServiceRoleClient();

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = myProfile?.role === "admin";

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, position, created_at")
    .order("created_at", { ascending: true });

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));
  // Идэвхгүй = Supabase-д хориглогдсон (banned_until ирээдүйд).
  const inactiveIds = new Set(
    (authUsers?.users || [])
      .filter((u) => u.banned_until && new Date(u.banned_until).getTime() > Date.now())
      .map((u) => u.id)
  );

  const { data: allCompletions } = await admin
    .from("lesson_progress")
    .select("user_id")
    .eq("is_completed", true);

  const completedCountByUser = new Map<string, number>();
  for (const row of allCompletions || []) {
    completedCountByUser.set(row.user_id, (completedCountByUser.get(row.user_id) || 0) + 1);
  }

  const rows = (profiles || [])
    .map((p) => {
      const completedLessons = completedCountByUser.get(p.id) || 0;
      const { level } = computeLevel(completedLessons);
      return {
        id: p.id,
        name: p.full_name || emailById.get(p.id) || "Нэргүй",
        email: emailById.get(p.id) || "",
        role: p.role,
        position: p.position || "",
        completedLessons,
        level,
        active: !inactiveIds.has(p.id),
      };
    })
    .sort((a, b) => b.completedLessons - a.completedLessons);
  const inactiveCount = rows.filter((r) => !r.active).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Ажилтнууд</h1>
      <p className="mt-1 text-sm text-ink/60">
        Нийт {rows.length} хэрэглэгч
        {inactiveCount > 0 && `, үүнээс ${inactiveCount} идэвхгүй`}, level-ээр нь эрэмбэлсэн.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Нэр</th>
              <th className="px-4 py-3">И-мэйл</th>
              <th className="px-4 py-3">Эрх</th>
              <th className="px-4 py-3">Албан тушаал</th>
              <th className="px-4 py-3 text-center">Дуусгасан хичээл</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Төлөв</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className={clsx("border-b border-ink/5 last:border-0", !r.active && "bg-ink/[0.03]")}
              >
                <td className="px-4 py-3 text-ink/50">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  <Link
                    prefetch={false}
                    href={`/admin/students/${r.id}`}
                    className="focus-ring text-brand-600 hover:underline"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/60">{r.email}</td>
                <td className="px-4 py-3 text-ink/60">{r.role}</td>
                <td className="px-4 py-3 text-ink/60">{r.position || "—"}</td>
                <td className="px-4 py-3 text-center text-ink/60">{r.completedLessons}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                    {r.level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                      r.active ? "bg-accent/10 text-accent" : "bg-ink/10 text-ink/60"
                    )}
                  >
                    {r.active ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.id !== user.id && (
                    <StudentRowActions
                      userId={r.id}
                      name={r.name}
                      email={r.email}
                      active={r.active}
                      canDelete={isAdmin}
                    />
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink/50">
                  Одоогоор хэрэглэгч алга.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
