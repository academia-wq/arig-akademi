"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BellIcon, ChevronRightIcon } from "@/components/icons";
import { Tooltip } from "@/components/tooltip";
import {
  NOTIFICATION_META,
  notificationHref,
  type NotificationType,
} from "@/lib/notification-meta";
import { formatRelativeTimeShort } from "@/lib/format";
import { markNotificationRead } from "@/app/(app)/notifications/actions";

type DropdownItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  courseSlug: string | null;
  relatedUserId: string | null;
  relatedAvatarUrl: string | null;
};

export function NotificationsDropdown({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DropdownItem[] | null>(null);
  const [unread, setUnread] = useState(unreadCount);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setUnread(unreadCount), [unreadCount]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch("/api/notifications", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { items: [], unreadCount: 0 }))
      .then((data: { items: DropdownItem[]; unreadCount: number }) => {
        setItems(data.items);
        setUnread(data.unreadCount);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open]);

  function handleSelect(n: DropdownItem) {
    setOpen(false);
    if (!n.is_read) {
      setUnread((v) => Math.max(0, v - 1));
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) ?? null);
      markNotificationRead(n.id).then(() => router.refresh());
    }
    router.push(notificationHref(n) ?? "/notifications");
  }

  return (
    <div className="relative" ref={ref}>
      <Tooltip label="Мэдэгдэл" side="bottom" hidden={open}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Мэдэгдэл"
          aria-haspopup="menu"
          aria-expanded={open}
          className="focus-ring relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/5 hover:text-ink"
        >
          <BellIcon className="h-[22px] w-[22px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-medium leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+18px)] w-[min(370px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#D9D9D9] bg-white shadow-[0px_8px_24px_rgba(72,83,83,0.12)]"
        >
          <div className="flex items-center gap-3 border-b border-[#D9D9D9] px-6 py-[18px]">
            <p className="text-base text-ink">Мэдэгдэл</p>
            {unread > 0 && (
              <span className="rounded-sm bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">
                {unread} шинэ
              </span>
            )}
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {items === null && (
              <p className="px-6 py-8 text-center text-sm text-[#8A9DA2]">Ачаалж байна...</p>
            )}
            {items?.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-[#8A9DA2]">Мэдэгдэл алга.</p>
            )}
            {items?.map((n) => {
              const Icon = NOTIFICATION_META[n.type].icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(n)}
                  className="focus-ring group relative flex w-full items-start gap-3 pl-6 pr-5 text-left transition hover:bg-paper"
                >
                  {!n.is_read && (
                    <span className="absolute left-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-500" />
                  )}
                  {n.relatedAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.relatedAvatarUrl}
                      alt=""
                      className="my-4 h-[38px] w-[38px] flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span
                      className={clsx(
                        "my-4 flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded border",
                        n.is_read
                          ? "border-[#8A9DA2] text-[#8A9DA2]"
                          : "border-brand-500 text-brand-500"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 border-b border-[#D9D9D9] py-4 group-last:border-b-0">
                    <span className="flex items-start gap-2">
                      <span
                        className={clsx(
                          "min-w-0 flex-1 text-sm font-medium",
                          n.is_read ? "text-[#8A9DA2]" : "text-ink"
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="flex-shrink-0 text-xs leading-5 text-[#8A9DA2]">
                        {formatRelativeTimeShort(n.created_at)}
                      </span>
                    </span>
                    <span className="mt-1.5 line-clamp-2 text-xs leading-[18px] text-[#8A9DA2]">
                      {n.body}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            prefetch={false}
            href="/notifications"
            onClick={() => setOpen(false)}
            className="focus-ring flex items-center justify-center gap-3 border-t border-[#D9D9D9] bg-paper py-5 text-sm text-ink transition hover:text-brand-500"
          >
            Бүх мэдэгдлийг харах
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
