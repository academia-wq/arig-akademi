import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

// Дээд мөрийн хонхны жижиг цонхонд зориулсан сүүлийн мэдэгдлүүд.
const LIMIT = 5;

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
  }

  const [{ data: rows }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, related_user_id, is_read, created_at, courses(slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  const relatedUserIds = Array.from(
    new Set((rows || []).map((n) => n.related_user_id).filter(Boolean))
  ) as string[];

  // Ажилтны зургийг харуулахын тулд — профайлын RLS нь зөвхөн өөрийнхийг харуулдаг.
  const { data: relatedProfiles } = relatedUserIds.length
    ? await createServiceRoleClient()
        .from("profiles")
        .select("id, avatar_url")
        .in("id", relatedUserIds)
    : { data: [] as { id: string; avatar_url: string | null }[] };
  const avatarById = new Map((relatedProfiles || []).map((p) => [p.id, p.avatar_url]));

  const items = (rows || []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    is_read: n.is_read,
    created_at: n.created_at,
    courseSlug: n.courses?.slug ?? null,
    relatedUserId: n.related_user_id,
    relatedAvatarUrl: n.related_user_id ? avatarById.get(n.related_user_id) ?? null : null,
  }));

  return NextResponse.json({ items, unreadCount: count || 0 });
}
