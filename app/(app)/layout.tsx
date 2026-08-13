import { createClient, getUser } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  let isStaff = false;
  let fullName: string | null = null;
  let avatarUrl: string | null = null;
  if (user) {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .single();
    isStaff = profile?.role === "admin" || profile?.role === "instructor";
    fullName = profile?.full_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
        isStaff={isStaff}
      />
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
