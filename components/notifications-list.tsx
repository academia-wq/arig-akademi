"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { SearchIcon, CalendarIcon, ChevronDownIcon } from "@/components/icons";
import { NOTIFICATION_META, type NotificationType } from "@/lib/notification-meta";
import { formatRelativeTime, formatMonthRange } from "@/lib/format";
import { NotificationDetailModal, type NotificationItem } from "@/components/notification-detail-modal";
import { markNotificationRead } from "@/app/(app)/notifications/actions";

type ListItem = NotificationItem & {
  relatedAvatarUrl: string | null;
  relatedInitials: string | null;
  dateGroup: string;
};

type FilterValue = "all" | "unread" | NotificationType;

export function NotificationsList({
  items,
  header,
  employeeCount,
}: {
  items: ListItem[];
  header: React.ReactNode;
  employeeCount: number | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [monthOffset, setMonthOffset] = useState(0);
  const [monthOpen, setMonthOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ListItem | null>(null);

  useEffect(() => {
    if (!monthOpen) return;
    function onClick(e: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) setMonthOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMonthOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [monthOpen]);

  const monthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const monthStart = monthDate.getTime();
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).getTime();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((n) => {
      const createdAt = new Date(n.created_at).getTime();
      if (createdAt < monthStart || createdAt >= monthEnd) return false;
      if (filter === "unread" && n.is_read) return false;
      if (filter !== "all" && filter !== "unread" && n.type !== filter) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    });
  }, [items, query, filter, monthStart, monthEnd]);

  const groups = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    for (const n of filtered) {
      const list = map.get(n.dateGroup) || [];
      list.push(n);
      map.set(n.dateGroup, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function handleOpen(n: ListItem) {
    setActive(n);
    if (!n.is_read) await markNotificationRead(n.id);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {header}
        <div className="relative sm:mt-[11px]" ref={monthRef}>
          <button
            type="button"
            onClick={() => setMonthOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={monthOpen}
            className="focus-ring flex items-center gap-2 rounded-md border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium leading-[18px] text-ink"
          >
            <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{formatMonthRange(monthDate)}</span>
            <ChevronDownIcon
              className={clsx("h-3.5 w-3.5 flex-shrink-0 transition", monthOpen && "rotate-180")}
            />
          </button>
          {monthOpen && (
            <ul
              role="listbox"
              className="absolute right-0 top-[calc(100%+6px)] z-10 max-h-72 w-full overflow-y-auto rounded-md border border-[#D9D9D9] bg-white py-1 shadow-lg"
            >
              {Array.from({ length: 12 }, (_, i) => -i).map((offset) => {
                const now = new Date();
                const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
                return (
                  <li key={offset}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={offset === monthOffset}
                      onClick={() => {
                        setMonthOffset(offset);
                        setMonthOpen(false);
                      }}
                      className={clsx(
                        "w-full px-4 py-2 text-left text-sm hover:bg-paper",
                        offset === monthOffset ? "font-medium text-brand-500" : "text-ink"
                      )}
                    >
                      {formatMonthRange(d)}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="relative w-full sm:w-[320px]">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9DA2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Мэдэгдэл хайх..."
            className="focus-ring h-10 w-full rounded-md border border-[#D9D9D9] bg-paper pl-10 pr-3 text-sm text-ink placeholder:text-[#8A9DA2]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "Бүгд"],
              ["unread", "Уншаагүй"],
              ["lesson_added", "Сургалт"],
              ["certificate_ready", "Гэрчилгээ"],
            ] as [FilterValue, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={clsx(
                "focus-ring h-10 rounded-md px-4 text-sm font-medium leading-[18px] transition",
                filter === value
                  ? "min-w-[98px] bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(255,127,86,0.5)]"
                  : "border border-[#D9D9D9] bg-paper text-[#8A9DA2] hover:border-brand-300 hover:bg-brand-50 hover:text-brand-500"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {employeeCount !== null && (
          <p className="text-sm font-medium leading-[18px] text-[#8A9DA2] sm:ml-auto">
            {employeeCount} ажилтан
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {groups.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink/20 p-10 text-center text-sm text-ink/50">
            Мэдэгдэл олдсонгүй.
          </p>
        )}
        {groups.map(([label, list]) => (
          <div
            key={label}
            className="flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-6"
          >
            <p className="text-base text-ink">{label}</p>
            {list.map((n) => {
              const Icon = NOTIFICATION_META[n.type].icon;
              const isToday = label === "Өнөөдөр";
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpen(n)}
                  className="focus-ring group relative flex min-h-[88px] w-full items-center gap-2 border-b border-[#E2E8F0] pb-[15px] pl-6 pt-4 text-left"
                >
                  {!n.is_read && (
                    <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand-500" />
                  )}
                  {n.relatedAvatarUrl || n.relatedInitials ? (
                    <span
                      className={clsx(
                        "flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden border bg-[#D9D9D9] font-display text-sm font-semibold text-ink",
                        n.is_read ? "border-[#8A9DA2]" : "border-brand-500"
                      )}
                    >
                      {n.relatedAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.relatedAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        n.relatedInitials
                      )}
                    </span>
                  ) : (
                    <span
                      className={clsx(
                        "flex h-14 w-14 flex-shrink-0 items-center justify-center border",
                        n.is_read
                          ? "border-[#8A9DA2] text-[#8A9DA2]"
                          : "border-brand-500 text-brand-500"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 self-start pt-1.5 leading-[18px]">
                    <span
                      className={clsx(
                        "block text-sm font-medium transition group-hover:text-brand-500",
                        n.is_read ? "text-[#8A9DA2]" : "text-ink"
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="mt-2 block max-w-[485px] text-xs text-[#8A9DA2]">
                      {n.body}
                    </span>
                  </span>
                  <span className="w-[120px] flex-shrink-0 text-right text-xs leading-[18px] text-[#8A9DA2]">
                    {isToday ? formatRelativeTime(n.created_at) : label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {active && (
        <NotificationDetailModal notification={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
}
