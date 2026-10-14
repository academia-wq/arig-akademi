import { AwardIcon, BookIcon, UserIcon } from "@/components/icons";

export type NotificationType = "lesson_added" | "certificate_ready" | "employee_added";

export const NOTIFICATION_META: Record<
  NotificationType,
  { badge: string; icon: typeof BookIcon; ctaLabel: string }
> = {
  lesson_added: { badge: "Сургалт", icon: BookIcon, ctaLabel: "Сургалт үзэх" },
  certificate_ready: { badge: "Гэрчилгээ", icon: AwardIcon, ctaLabel: "Гэрчилгээ үзэх" },
  employee_added: { badge: "Ажилтан", icon: UserIcon, ctaLabel: "Ажилтан харах" },
};

// Мэдэгдэл дээр дарахад очих хуудас (байхгүй бол null).
export function notificationHref(n: {
  type: NotificationType;
  courseSlug: string | null;
  relatedUserId: string | null;
}): string | null {
  if (n.type === "employee_added") {
    return n.relatedUserId ? `/admin/students/${n.relatedUserId}` : null;
  }
  if (n.type === "certificate_ready") return "/certificates";
  return n.courseSlug ? `/learn/${n.courseSlug}` : null;
}
