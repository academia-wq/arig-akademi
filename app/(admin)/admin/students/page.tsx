import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { computeLevel } from "@/lib/gamification";
import { DeleteButton } from "@/components/delete-button";

async function updatePosition(userId: string, formData: FormData) {
  "use server";
  const admin = createServiceRoleClient();
  const position = (formData.get("position") as string).trim();
  await admin
    .from("profiles")
    .update({ position: position || null })
    .eq("id", userId);
  revalidatePath("/admin/students");
}

async function deleteUser(userId: string) {
  "use server";
  const admin = createServiceRoleClient();
  await admin.from("ai_usage_logs").delete().eq("user_id", userId);
  await admin.from("lesson_progress").delete().eq("user_id", userId);
  await admin.from("enrollments").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin/students");
}

export default async function AdminStudentsPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/admin/students");

  const admin = createServiceRoleClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, position, created_at")
    .order("created_at", { ascending: true });

  const { data: authUsers } = await admin.auth.admin.listUsers();
  const emailById = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));

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
      };
    })
    .sort((a, b) => b.completedLessons - a.completedLessons);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Ажилтнууд</h1>
      <p className="mt-1 text-sm text-ink/60">
        Нийт {rows.length} хэрэглэгч, level-ээр нь эрэмбэлсэн.
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
              <th className="px-4 py-3">Дуусгасан хичээл</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-ink/5 last:border-0">
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
                <td className="px-4 py-3">
                  <form
                    action={updatePosition.bind(null, r.id)}
                    className="flex gap-1"
                  >
                    <input
                      name="position"
                      defaultValue={r.position}
                      placeholder="жишээ: Менежер"
                      className="focus-ring w-32 rounded-md border border-ink/15 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="focus-ring rounded-md border border-ink/15 px-2 py-1 text-xs font-medium hover:border-ink/30"
                    >
                      Хадгалах
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-ink/60">{r.completedLessons}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                    {r.level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.id !== user.id && (
                    <form action={deleteUser.bind(null, r.id)}>
                      <DeleteButton
                        confirmText={`"${r.name}" (${r.email}) хэрэглэгчийг устгах уу? Энэ хэрэглэгчийн бүх явц, элсэлт мөн устана.`}
                      />
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink/50">
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
