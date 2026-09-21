import Link from "next/link";
import { BrandMarkIcon } from "@/components/icons";

export function AppFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper py-9 pl-8 pr-8 lg:pr-[120px]">
      <div className="flex flex-col justify-between gap-8 md:flex-row">
        <div className="max-w-sm">
          <Link prefetch={false} href="/" className="focus-ring flex items-center gap-2.5">
            <span className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full bg-ink">
              <BrandMarkIcon className="h-[30px] w-[30px] text-paper" />
            </span>
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
