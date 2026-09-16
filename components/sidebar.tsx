"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  HomeIcon,
  LayoutDashboardIcon,
  BookIcon,
  AwardIcon,
  UserIcon,
  XIcon,
} from "@/components/icons";

export function Sidebar({
  isStaff,
  mobileOpen,
  onNavigate,
}: {
  isStaff: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Нүүр", icon: HomeIcon },
    isStaff
      ? { href: "/admin", label: "Админ панель", icon: LayoutDashboardIcon }
      : { href: "/dashboard", label: "Хяналтын самбар", icon: LayoutDashboardIcon },
    { href: "/learn", label: "Миний сургалт", icon: BookIcon },
    { href: "/certificates", label: "Гэрчилгээнүүд", icon: AwardIcon },
    { href: "/settings", label: "Профайл", icon: UserIcon },
  ];

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-shrink-0 flex-col overflow-y-auto bg-ink px-6 py-6 transition-transform duration-200 md:static md:z-auto md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between">
        <Link
          prefetch={false}
          href="/"
          onClick={onNavigate}
          className="focus-ring-dark flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-[50px] w-[50px] flex-shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold uppercase tracking-wide text-paper">
              Ариг <span className="text-brand-500">академи</span>
            </p>
            <p className="text-sm text-paper">Хөгжлөөр үйлчилнэ</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Цэс хаах"
          className="focus-ring-dark flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-paper/70 hover:bg-white/5 hover:text-paper md:hidden"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              prefetch={false}
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "focus-ring-dark flex items-center gap-3 rounded-lg px-4 py-3 transition",
                active ? "bg-brand-500 text-paper" : "text-paper hover:bg-white/5"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 hidden sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/sidebar-illustration.svg"
          alt=""
          className="h-auto w-full -scale-y-100"
        />
      </div>
    </aside>
  );
}
