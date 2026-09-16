import { createClient, getUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  let isStaff = false;
  let fullName: string | null = null;
  let avatarUrl: string | null = null;
  let position: string | null = null;
  if (user) {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url, position")
      .eq("id", user.id)
      .single();
    isStaff = profile?.role === "admin" || profile?.role === "instructor";
    fullName = profile?.full_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    position = profile?.position ?? null;
  }

  return (
    <AppShell
      isStaff={isStaff}
      fullName={fullName}
      email={user?.email ?? null}
      position={position}
      avatarUrl={avatarUrl}
    >
      {children}
    </AppShell>
  );
}
