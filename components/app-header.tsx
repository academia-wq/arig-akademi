"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { SignOutButton } from "@/components/sign-out-button";
import { SearchIcon, BellIcon, BookIcon, PlayCircleIcon } from "@/components/icons";

function initialsOf(name: string | null, email: string | null) {
  const source = (name || "").trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
    if (letters.length) return letters.join("");
  }
  return (email || "?")[0]?.toUpperCase() || "?";
}

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

export function AppHeader({
  fullName,
  email,
  avatarUrl,
  isStaff,
}: {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  isStaff: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    function onClick(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (
        searchOpen &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

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

  const navLinks = [
    { href: "/dashboard", label: "Нүүр" },
    { href: "/learn", label: "Миний сургалт" },
    ...(isStaff ? [{ href: "/admin/courses", label: "Админ" }] : []),
  ];

  const initials = initialsOf(fullName, email);
  const hasQuery = query.trim().length >= 2;
  const hasResults = results.courses.length > 0 || results.lessons.length > 0;

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
        <div className="flex items-center gap-10">
          <Link
            prefetch={false}
            href="/dashboard"
            className="focus-ring font-display text-lg font-bold tracking-tight text-ink"
          >
            Ариг Академи
          </Link>

          <nav className="hidden items-center gap-7 text-[15px] font-medium md:flex">
            {navLinks.map((link) => {
              const active =
                pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  prefetch={false}
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "focus-ring relative py-1 transition",
                    active ? "text-ink" : "text-ink/60 hover:text-ink"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-[15px] left-0 right-0 h-[2.5px] rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={searchRef}>
            <button
              type="button"
              aria-label="Хайх"
              aria-haspopup="true"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/5 hover:text-ink"
            >
              <SearchIcon className="h-[19px] w-[19px]" />
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-[calc(100%+14px)] w-80 rounded-lg border border-ink/10 bg-white shadow-lg sm:w-96">
                <span className="absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-ink/10 bg-white" />

                <div className="relative border-b border-ink/10 p-3">
                  <SearchIcon className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                  <input
                    ref={searchInputRef}
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
                    <p className="px-3 py-4 text-center text-sm text-ink/40">
                      Хайж байна...
                    </p>
                  )}

                  {hasQuery && !searching && !hasResults && (
                    <p className="px-3 py-4 text-center text-sm text-ink/40">
                      Илэрц олдсонгүй
                    </p>
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
                          <BookIcon className="h-4 w-4 flex-shrink-0 text-brand-500" />
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
                          <PlayCircleIcon className="h-4 w-4 flex-shrink-0 text-brand-500" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-ink/80">
                              {l.title}
                            </span>
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

          <button
            type="button"
            aria-label="Мэдэгдэл"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/5 hover:text-ink"
          >
            <BellIcon className="h-[19px] w-[19px]" />
          </button>

          <div className="relative ml-1" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-50 font-display text-sm font-bold text-brand-700 transition hover:bg-brand-100"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+14px)] w-64 rounded-lg border border-ink/10 bg-white p-4 shadow-lg"
              >
                <span className="absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-ink/10 bg-white" />

                <div className="flex flex-col items-center border-b border-ink/10 pb-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-50 font-display text-base font-bold text-brand-700">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <p className="mt-2 font-display text-sm font-bold text-ink">
                    Тавтай морил, {fullName || email}!
                  </p>
                </div>

                <nav className="mt-3 flex flex-col gap-1 text-sm font-medium">
                  <Link
                    prefetch={false}
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="focus-ring rounded-md px-2 py-1.5 text-brand-700 hover:bg-brand-50"
                  >
                    Профайл, тохиргоо
                  </Link>
                  {isStaff && (
                    <Link
                      prefetch={false}
                      href="/admin/courses"
                      onClick={() => setMenuOpen(false)}
                      className="focus-ring rounded-md px-2 py-1.5 text-brand-700 hover:bg-brand-50"
                    >
                      Админ самбар
                    </Link>
                  )}
                  <div className="mt-1 border-t border-ink/10 pt-2">
                    <SignOutButton className="w-full rounded-md px-2 py-1.5 text-left text-ink/70 hover:bg-ink/5 hover:text-ink" />
                  </div>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
