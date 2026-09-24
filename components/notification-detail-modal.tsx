"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XIcon } from "@/components/icons";
import { NOTIFICATION_META, type NotificationType } from "@/lib/notification-meta";
import { formatRelativeTime } from "@/lib/format";
import { markNotificationRead, deleteNotification } from "@/app/(app)/notifications/actions";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  courseSlug: string | null;
  relatedUserId: string | null;
};

export function NotificationDetailModal({
  notification,
  onClose,
}: {
  notification: NotificationItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const meta = NOTIFICATION_META[notification.type];
  const Icon = meta.icon;

  const ctaHref =
    notification.type === "employee_added"
      ? notification.relatedUserId
        ? `/admin/students/${notification.relatedUserId}`
        : null
      : notification.type === "certificate_ready"
      ? "/certificates"
      : notification.courseSlug
      ? `/learn/${notification.courseSlug}`
      : null;

  async function handleMarkRead() {
    setBusy(true);
    await markNotificationRead(notification.id);
    setBusy(false);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    setBusy(true);
    await deleteNotification(notification.id);
    setBusy(false);
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <p className="text-lg text-ink">Мэдэгдэл</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-500 text-brand-500 hover:bg-brand-50"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="rounded-md bg-brand-500 px-3 py-1 text-sm font-medium text-white">
            {meta.badge}
          </span>
          <span className="text-sm text-ink/40">{formatRelativeTime(notification.created_at)}</span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-brand-500 text-brand-500">
            <Icon className="h-7 w-7" />
          </span>
          <p className="text-base text-ink">{notification.title}</p>
        </div>

        <p className="mt-5 text-center text-sm text-ink/70">&ldquo;{notification.body}&rdquo;</p>

        <div className="mt-7 flex flex-col gap-3">
          {ctaHref && (
            <Link
              prefetch={false}
              href={ctaHref}
              onClick={() => {
                if (!notification.is_read) markNotificationRead(notification.id);
              }}
              className="focus-ring rounded-md bg-brand-500 px-4 py-2.5 text-center text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700"
            >
              {meta.ctaLabel}
            </Link>
          )}
          {!notification.is_read && (
            <button
              type="button"
              onClick={handleMarkRead}
              disabled={busy}
              className="focus-ring rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/60 transition hover:border-ink/30 disabled:opacity-50"
            >
              Уншсан болгох
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="focus-ring rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink/60 transition hover:border-ink/30 disabled:opacity-50"
          >
            Устгах
          </button>
        </div>
      </div>
    </div>
  );
}
