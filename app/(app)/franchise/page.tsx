import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireFranchiseManager } from "@/lib/franchise-auth";
import { isModuleVisible } from "@/lib/module-visibility";
import { FranchiseEmployeeTable, type FranchiseEmployee } from "@/components/franchise-employee-table";
import { CopyLinkButton } from "@/components/copy-link-button";

// Франчайзын менежерийн хуудас: зөвхөн өөрийн франчайзын ажилтнууд, тэдний явц.
// Өгөгдлийг service role-оор уншиж, franchise_id-аар заавал шүүнэ.
export default async function FranchisePage() {
  const manager = await requireFranchiseManager();
  if (!manager.ok) redirect("/");

  const db = createServiceRoleClient();
  const [{ data: franchise }, { data: members }, { data: modules }, { data: authUsers }] =
    await Promise.all([
      db.from("franchises").select("name, invite_code, is_active").eq("id", manager.franchiseId).single(),
      db
        .from("profiles")
        .select("id, full_name, role, department, position, employee_type, avatar_url, created_at")
        .eq("franchise_id", manager.franchiseId)
        .order("created_at", { ascending: false }),
      db
        .from("modules")
        .select(
          "id, visible_positions, visible_departments, audience, courses!inner(is_published), lessons(id)"
        )
        .eq("courses.is_published", true),
      db.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const memberIds = (members || []).map((m) => m.id);
  const { data: completedRows } = await db
    .from("lesson_progress")
    .select("user_id, lesson_id, completed_at")
    .eq("is_completed", true)
    .in("user_id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

  const authById = new Map((authUsers?.users || []).map((u) => [u.id, u]));
  const completedByUser = new Map<string, Map<string, string | null>>();
  for (const row of completedRows || []) {
    const m = completedByUser.get(row.user_id) || new Map<string, string | null>();
    m.set(row.lesson_id, row.completed_at);
    completedByUser.set(row.user_id, m);
  }

  const employees: FranchiseEmployee[] = (members || []).map((p) => {
    const visibleLessonIds = (modules || [])
      .filter((mod) => isModuleVisible(mod, p))
      .flatMap((mod: any) => (mod.lessons || []).map((l: { id: string }) => l.id));
    const done = completedByUser.get(p.id) || new Map<string, string | null>();
    const completedDates = visibleLessonIds
      .filter((id) => done.has(id))
      .map((id) => done.get(id))
      .filter(Boolean) as string[];
    const authUser = authById.get(p.id);
    const bannedUntil = (authUser as { banned_until?: string } | undefined)?.banned_until;
    return {
      id: p.id,
      name: p.full_name || authUser?.email || "Нэргүй",
      email: authUser?.email || "",
      avatarUrl: p.avatar_url,
      department: p.department,
      position: p.position,
      isManager: p.role === "franchise_manager",
      isActive: !bannedUntil || new Date(bannedUntil) < new Date(),
      totalLessons: visibleLessonIds.length,
      completedLessons: completedDates.length,
      lastActivity: completedDates.sort().at(-1) || null,
    };
  });

  const learners = employees.filter((e) => !e.isManager && e.isActive);
  const avgProgress = learners.length
    ? Math.round(
        learners.reduce(
          (sum, e) => sum + (e.totalLessons ? (e.completedLessons / e.totalLessons) * 100 : 0),
          0
        ) / learners.length
      )
    : 0;
  const pendingCount = employees.filter((e) => !e.isManager && !e.position).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-500 bg-paper p-5">
        <div>
          <p className="text-base text-brand-500">Франчайзын самбар</p>
          <p className="mt-1 text-ink">{franchise?.name}</p>
        </div>
        {franchise?.is_active ? (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <p className="text-xs text-ink/50">Шинэ ажилтанд илгээх бүртгэлийн холбоос</p>
            <CopyLinkButton path={`/register?code=${franchise.invite_code}`} />
          </div>
        ) : (
          <p className="text-sm text-ink/50">Бүртгэлийн холбоос идэвхгүй байна.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Нийт ажилтан", value: employees.filter((e) => !e.isManager).length },
          { label: "Дундаж явц", value: `${avgProgress}%` },
          { label: "Хэлтэс оноогоогүй", value: pendingCount },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ink/15 bg-white p-5">
            <p className="text-sm text-ink/50">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <FranchiseEmployeeTable employees={employees} />
    </div>
  );
}
