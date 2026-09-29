"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { SearchIcon, CalendarIcon, ChevronRightIcon } from "@/components/icons";
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

export function NotificationsList({ items }: { items: ListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [monthOffset, setMonthOffset] = useState(0);
  const [active, setActive] = useState<ListItem | null>(null);

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
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-[7.5px] border border-[#D9D9D9] bg-paper px-3 py-2 text-sm text-ink">
          <CalendarIcon className="h-4 w-4 flex-shrink-0 text-[#8A9DA2]" />
          <button
            type="button"
            onClick={() => setMonthOffset((v) => v - 1)}
            aria-label="Өмнөх сар"
            className="focus-ring rounded p-0.5 hover:bg-ink/5"
          >
            <ChevronRightIcon className="h-3.5 w-3.5 rotate-180 text-ink/50" />
          </button>
          <span className="whitespace-nowrap px-1">{formatMonthRange(monthDate)}</span>
          <button
            type="button"
            onClick={() => setMonthOffset((v) => v + 1)}
            aria-label="Дараах сар"
            className="focus-ring rounded p-0.5 hover:bg-ink/5"
          >
            <ChevronRightIcon className="h-3.5 w-3.5 text-ink/50" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[319px]">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9DA2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Мэдэгдэл хайх..."
            className="focus-ring h-[39px] w-full rounded-[7.5px] border border-[#D9D9D9] bg-paper pl-10 pr-3 text-sm text-ink placeholder:text-[#8A9DA2]"
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
                "focus-ring h-[39px] rounded-[7.5px] px-5 text-sm font-medium transition",
                filter === value
                  ? "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                  : "border border-[#D9D9D9] bg-paper text-[#8A9DA2] hover:border-ink/30"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {groups.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink/20 p-10 text-center text-sm text-ink/50">
            Мэдэгдэл олдсонгүй.
          </p>
        )}
        {groups.map(([label, list]) => (
          <div key={label}>
            <p className="text-ink">{label}</p>
            <div className="mt-3 flex flex-col gap-3">
              {list.map((n) => {
                const meta = NOTIFICATION_META[n.type];
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleOpen(n)}
                    className="focus-ring flex items-start gap-3 rounded-2xl border border-ink/15 bg-white p-4 text-left transition hover:border-brand-300"
                  >
                    <span
                      className={clsx(
                        "mt-1 h-2 w-2 flex-shrink-0 rounded-full",
                        n.is_read ? "bg-transparent" : "bg-brand-500"
                      )}
                    />
                    {n.relatedAvatarUrl || n.relatedInitials ? (
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 font-display text-sm font-semibold text-brand-700">
                        {n.relatedAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.relatedAvatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          n.relatedInitials
                        )}
                      </span>
                    ) : (
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-brand-500 text-brand-500">
                        <Icon className="h-5 w-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink">{n.title}</span>
                      <span className="mt-0.5 block truncate text-sm text-ink/50">{n.body}</span>
                    </span>
                    <span className="flex-shrink-0 text-xs text-ink/40">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {active && (
        <NotificationDetailModal notification={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
}
