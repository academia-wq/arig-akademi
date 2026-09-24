"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { SearchIcon } from "@/components/icons";
import { NOTIFICATION_META } from "@/lib/notification-meta";
import { formatRelativeTime } from "@/lib/format";
import { NotificationDetailModal, type NotificationItem } from "@/components/notification-detail-modal";
import { markNotificationRead } from "@/app/(app)/notifications/actions";

type ListItem = NotificationItem & {
  relatedAvatarUrl: string | null;
  relatedInitials: string | null;
  dateGroup: string;
};

export function NotificationsList({ items }: { items: ListItem[] }) {
  const [query, setQuery] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [active, setActive] = useState<ListItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((n) => {
      if (onlyUnread && n.is_read) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    });
  }, [items, query, onlyUnread]);

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
      <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyUnread(false)}
            className={clsx(
              "focus-ring h-[39px] rounded-[7.5px] px-5 text-sm font-medium transition",
              !onlyUnread
                ? "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                : "border border-[#D9D9D9] bg-paper text-[#8A9DA2] hover:border-ink/30"
            )}
          >
            Бүгд
          </button>
          <button
            type="button"
            onClick={() => setOnlyUnread(true)}
            className={clsx(
              "focus-ring h-[39px] rounded-[7.5px] px-5 text-sm font-medium transition",
              onlyUnread
                ? "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                : "border border-[#D9D9D9] bg-paper text-[#8A9DA2] hover:border-ink/30"
            )}
          >
            Уншаагүй
          </button>
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
