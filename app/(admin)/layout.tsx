import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const user = await getUser();

  if (!user) redirect("/login?redirect=/admin/courses");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "instructor") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link prefetch={false} href="/admin/courses" className="font-display font-bold">
            Ариг Академи — Админ
          </Link>
          <Link prefetch={false} href="/dashboard" className="text-sm text-white/70 hover:text-white">
            Сурагчийн тал руу
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
