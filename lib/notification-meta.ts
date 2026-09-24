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
