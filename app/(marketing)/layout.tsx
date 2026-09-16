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
            className="focus-ring flex items-center gap-2.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-9 w-9" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              Ариг Академи
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
            <Link prefetch={false} href="/courses" className="hover:text-ink">
              Сургалтууд
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
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-9 w-9" />
              <div>
                <p className="font-display text-base font-semibold text-ink">
                  Ариг Академи
                </p>
                <p className="mt-1 text-sm text-ink/50">
                  Хөгжлөөр үйлчилнэ.
                </p>
              </div>
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

            <div className="text-sm text-ink/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Холбоо барих
              </p>
              <a
                href="tel:+97670007020"
                className="focus-ring mt-2 block hover:text-ink"
              >
                7000-7020
              </a>
              <a
                href="mailto:academia@ariganya.com"
                className="focus-ring mt-1 block hover:text-ink"
              >
                academia@ariganya.com
              </a>
            </div>
          </div>
          <p className="mt-8 text-xs text-ink/40">
            © {new Date().getFullYear()} Ариг Академи. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </footer>
    </div>
  );
}
