import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) redirect("/login?redirect=/admin/courses");

  const supabase = createClient();
  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, full_name, avatar_url, position")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  if (profile?.role !== "admin" && profile?.role !== "instructor") {
    redirect("/dashboard");
  }

  return (
    <AppShell
      isStaff
      fullName={profile?.full_name ?? null}
      email={user.email ?? null}
      position={profile?.position ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      unreadNotifications={count || 0}
    >
      {children}
    </AppShell>
  );
}
