import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper px-8 py-9">
      <div className="flex flex-col justify-between gap-8 md:flex-row">
        <div className="max-w-sm">
          <Link prefetch={false} href="/" className="focus-ring flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-[50px] w-[50px]" />
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-ink">
                Ариг <span className="text-brand-500">академи</span>
              </p>
              <p className="text-sm text-ink">Хөгжлөөр үйлчилнэ</p>
            </div>
          </Link>
          <p className="mt-4 text-xs text-ink/50">
            Ажилтнуудынхаа мэдлэг, ур чадварыг тасралтгүй хөгжүүлэх цахим
            сургалтын платформ.
          </p>
        </div>

        <div>
          <p className="text-base uppercase tracking-tight text-ink">Холбоо барих</p>
          <p className="mt-4 text-xs text-ink/50">7000-7020</p>
          <p className="text-xs text-ink/50">academia@ariganya.com</p>
        </div>
      </div>

      <p className="mt-8 text-xs text-ink/50">
        © 2026 Ариг Академи. Бүх эрх хуулиар хамгаалагдсан.
      </p>
    </footer>
  );
}
