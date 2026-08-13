import Link from "next/link";
import { getUser } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            prefetch={false}
            href="/"
            className="focus-ring font-display text-lg font-semibold tracking-tight text-ink"
          >
            Ариг Академи
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
            <Link prefetch={false} href="/#courses" className="hover:text-ink">
              Сургалтууд
            </Link>
            <Link prefetch={false} href="/#about" className="hover:text-ink">
              Бидний тухай
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                prefetch={false}
                href="/dashboard"
                className="focus-ring rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Хяналтын самбар
              </Link>
            ) : (
              <>
                <Link
                  prefetch={false}
                  href="/login"
                  className="focus-ring text-sm font-medium text-ink/70 hover:text-ink"
                >
                  Нэвтрэх
                </Link>
                <Link
                  prefetch={false}
                  href="/register"
                  className="focus-ring rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Бүртгүүлэх
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-base font-semibold text-ink">
                Ариг Академи
              </p>
              <p className="mt-1 text-sm text-ink/50">
                Хөгжлөөр үйлчилнэ.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/60">
              <Link prefetch={false} href="/" className="hover:text-ink">
                Нүүр
              </Link>
              <Link prefetch={false} href="/login" className="hover:text-ink">
                Нэвтрэх
              </Link>
              <Link prefetch={false} href="/register" className="hover:text-ink">
                Бүртгүүлэх
              </Link>
            </nav>
          </div>
          <p className="mt-8 text-xs text-ink/40">
            © {new Date().getFullYear()} Ариг Академи. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </footer>
    </div>
  );
}
