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
          <div className="flex items-center gap-6">
            <Link prefetch={false} href="/admin/courses" className="font-display font-semibold">
              Ариг Академи — Админ
            </Link>
            <Link prefetch={false} href="/admin/students" className="text-sm text-white/70 hover:text-white">
              Ажилтнууд
            </Link>
            <Link prefetch={false} href="/admin/onboarding" className="text-sm text-white/70 hover:text-white">
              Хөөрөх зурвас
            </Link>
            <Link prefetch={false} href="/admin/structure" className="text-sm text-white/70 hover:text-white">
              Бүтэц
            </Link>
            <Link
              prefetch={false}
              href="/admin/mystery-shopper"
              className="text-sm text-white/70 hover:text-white"
            >
              Нууц үйлчлүүлэгч
            </Link>
          </div>
          <Link prefetch={false} href="/dashboard" className="text-sm text-white/70 hover:text-white">
            Сурагчийн тал руу
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
