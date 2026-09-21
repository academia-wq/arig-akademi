import Link from "next/link";
import { BrandMarkIcon } from "@/components/icons";

export function AppFooter() {
  return (
    <footer className="border-t border-[#D9D9D9] bg-paper pb-16 pl-8 pr-8 pt-[35px] lg:pr-[120px]">
      <div className="flex flex-col justify-between gap-8 md:flex-row">
        <div>
          <Link prefetch={false} href="/" className="focus-ring flex items-center gap-4">
            <BrandMarkIcon className="h-[50px] w-[50px] flex-shrink-0 text-ink" />
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-ink">
                Ариг <span className="text-brand-500">академи</span>
              </p>
              <p className="text-sm text-ink">Хөгжлөөр үйлчилнэ</p>
            </div>
          </Link>
          <p className="mt-[18px] max-w-[250px] text-xs text-[#8A9DA2]">
            Ажилтнуудынхаа мэдлэг, ур чадварыг тасралтгүй хөгжүүлэх цахим сургалтын
            платформ.
          </p>
        </div>

        <div>
          <p className="text-base uppercase tracking-tight text-ink">Холбоо барих</p>
          <p className="mt-10 text-xs text-[#8A9DA2]">7000-7020</p>
          <p className="text-xs text-[#8A9DA2]">academia@ariganya.com</p>
        </div>
      </div>

      <p className="mt-10 text-xs text-ink lg:mt-[70px]">
        © 2026 Ариг Академи. Бүх эрх хуулиар хамгаалагдсан.
      </p>
    </footer>
  );
}
