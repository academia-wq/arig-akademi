import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient, getUser } from "@/lib/supabase/server";
import { NotificationsList } from "@/components/notifications-list";
import { initialsOf } from "@/lib/format";

function dateGroupLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (diffDays === 0) return "Өнөөдөр";
  if (diffDays === 1) return "Өчигдөр";
  if (diffDays < 7) return `${diffDays} өдрийн өмнө`;
  return date.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
}

export default async function NotificationsPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/notifications");

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, title, body, course_id, related_user_id, is_read, created_at, courses(slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const relatedUserIds = Array.from(
    new Set((rows || []).map((n) => n.related_user_id).filter(Boolean))
  ) as string[];

  const { data: relatedProfiles } = relatedUserIds.length
    ? await createServiceRoleClient()
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", relatedUserIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };
  const profileById = new Map((relatedProfiles || []).map((p) => [p.id, p]));

  const items = (rows || []).map((n: any) => {
    const relatedProfile = n.related_user_id ? profileById.get(n.related_user_id) : undefined;
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      is_read: n.is_read,
      created_at: n.created_at,
      courseSlug: n.courses?.slug ?? null,
      relatedUserId: n.related_user_id,
      relatedAvatarUrl: relatedProfile?.avatar_url ?? null,
      relatedInitials: n.type === "employee_added" ? initialsOf(relatedProfile?.full_name ?? null, null) : null,
      dateGroup: dateGroupLabel(n.created_at),
    };
  });

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Мэдэгдэл</h1>
      <p className="mt-1 text-sm text-ink/50">
        Нийт {items.length} мэдэгдэлтэй,{" "}
        <span className="font-medium text-brand-500">{unreadCount} Уншаагүй</span>
      </p>

      <div className="mt-6">
        <NotificationsList items={items} />
      </div>
    </div>
  );
}
