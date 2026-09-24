"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon, BellIcon, MenuIcon } from "@/components/icons";
import { SignOutButton } from "@/components/sign-out-button";
import { initialsOf } from "@/lib/format";

type SearchResults = {
  courses: { id: string; title: string; slug: string }[];
  lessons: {
    id: string;
    title: string;
    courseSlug: string;
    courseTitle: string;
  }[];
};

const EMPTY_RESULTS: SearchResults = { courses: [], lessons: [] };

const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/admin", title: "Админ панель" },
  { prefix: "/learn", title: "Миний сургалт" },
  { prefix: "/dashboard", title: "Хяналтын самбар" },
  { prefix: "/certificates", title: "Гэрчилгээнүүд" },
  { prefix: "/notifications", title: "Мэдэгдэл" },
  { prefix: "/settings", title: "Профайл" },
];

export function AppTopBar({
  fullName,
  email,
  position,
  avatarUrl,
  unreadNotifications,
  onMenuClick,
}: {
  fullName: string | null;
  email: string | null;
  position: string | null;
  avatarUrl: string | null;
  unreadNotifications: number;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES.find((t) => pathname?.startsWith(t.prefix))?.title;

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, menuOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : EMPTY_RESULTS))
        .then((data: SearchResults) => setResults(data))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
  }

  function goTo(href: string) {
    closeSearch();
    router.push(href);
  }

  const initials = initialsOf(fullName, email);
  const hasQuery = query.trim().length >= 2;
  const hasResults = results.courses.length > 0 || results.lessons.length > 0;

  return (
    <header className="relative z-20 flex h-[80px] items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 sm:pl-8 sm:pr-8 lg:pr-[120px]">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Цэс нээх"
        className="focus-ring flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5 hover:text-ink md:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-8">
      {pageTitle && (
        <p className="hidden flex-shrink-0 text-base text-ink md:block">{pageTitle}</p>
      )}
      <div className="relative min-w-0 max-w-[320px] flex-1" ref={searchRef}>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="focus-ring flex w-full items-center gap-2 rounded-lg border border-ink/15 bg-paper px-4 py-2.5 text-left text-sm text-ink/50"
        >
          <SearchIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Сургалт, сэдэв, ур чадвар хайх...</span>
        </button>

        {searchOpen && (
          <div className="absolute left-0 top-[calc(100%+10px)] w-[min(24rem,90vw)] rounded-lg border border-ink/10 bg-white shadow-lg">
            <div className="relative border-b border-ink/10 p-3">
              <SearchIcon className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Хичээл, курс хайх..."
                className="focus-ring w-full rounded-md border border-ink/10 py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {!hasQuery && (
                <p className="px-3 py-4 text-center text-sm text-ink/40">
                  Хамгийн багадаа 2 үсэг бичнэ үү
                </p>
              )}
              {hasQuery && searching && (
                <p className="px-3 py-4 text-center text-sm text-ink/40">Хайж байна...</p>
              )}
              {hasQuery && !searching && !hasResults && (
                <p className="px-3 py-4 text-center text-sm text-ink/40">Илэрц олдсонгүй</p>
              )}
              {hasQuery && !searching && results.courses.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
                    Курсууд
                  </p>
                  {results.courses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => goTo(`/learn/${c.slug}`)}
                      className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-ink/5"
                    >
                      <span className="truncate text-ink/80">{c.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {hasQuery && !searching && results.lessons.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
                    Хичээлүүд
                  </p>
                  {results.lessons.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => goTo(`/learn/${l.courseSlug}/${l.id}`)}
                      className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-ink/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ink/80">{l.title}</span>
                        <span className="block truncate text-xs text-ink/40">
                          {l.courseTitle}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
        <Link
          prefetch={false}
          href="/notifications"
          aria-label="Мэдэгдэл"
          className="focus-ring relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/5 hover:text-ink"
        >
          <BellIcon className="h-[22px] w-[22px]" />
          {unreadNotifications > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-sm bg-brand-500" />
          )}
        </Link>

        {email ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="focus-ring flex items-center gap-3"
            >
              <div className="hidden text-right sm:block">
                <p className="font-display text-sm font-semibold text-ink">
                  {fullName || email}
                </p>
                <p className="text-xs text-ink/50">{position || "Ажилтан"}</p>
              </div>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-50 font-display text-sm font-semibold text-brand-700">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+14px)] w-56 rounded-lg border border-ink/10 bg-white p-3 shadow-lg"
              >
                <span className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 border-l border-t border-ink/10 bg-white" />
                <nav className="flex flex-col gap-1 text-sm font-medium">
                  <Link
                    prefetch={false}
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="focus-ring rounded-md px-2 py-1.5 text-brand-700 hover:bg-brand-50"
                  >
                    Профайл, тохиргоо
                  </Link>
                  <div className="mt-1 border-t border-ink/10 pt-2">
                    <SignOutButton className="w-full rounded-md px-2 py-1.5 text-left text-ink/70 hover:bg-ink/5 hover:text-ink" />
                  </div>
                </nav>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              prefetch={false}
              href="/login"
              className="focus-ring rounded-md border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/30"
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
          </div>
        )}
      </div>
    </header>
  );
}
