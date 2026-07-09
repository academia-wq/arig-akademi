import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  let isStaff = false;
  if (user) {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStaff = profile?.role === "admin" || profile?.role === "instructor";
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link prefetch={false} href="/dashboard" className="font-display font-bold text-ink">
            Ариг Академи
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link prefetch={false} href="/dashboard" className="text-ink/70 hover:text-ink">
              Миний курс
            </Link>
            {isStaff && (
              <Link prefetch={false} href="/admin/courses" className="text-ink/70 hover:text-ink">
                Админ
              </Link>
            )}
            <Link prefetch={false} href="/settings" className="text-ink/70 hover:text-ink">
              Тохиргоо
            </Link>
            <span className="text-ink/40">{user?.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
