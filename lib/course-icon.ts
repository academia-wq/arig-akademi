import {
  BookIcon,
  HeartIcon,
  LightbulbIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/icons";

const RULES: { keywords: string[]; icon: typeof BookIcon; tint: string; tone: string }[] = [
  {
    keywords: ["цэвэрлэгээ", "орчин", "эрүүл ахуй", "хог"],
    icon: SparklesIcon,
    tint: "bg-accent/10",
    tone: "text-accent",
  },
  {
    keywords: ["харилцаа", "утас", "утсаар", "яриа"],
    icon: PhoneIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
  },
  {
    keywords: ["ёс зүй", "стандарт", "дүрэм", "журам", "аюулгүй"],
    icon: ShieldCheckIcon,
    tint: "bg-brand-100",
    tone: "text-brand-700",
  },
  {
    keywords: ["шийдвэр", "менежмент", "төлөвлөгөө", "төлөвлөлт"],
    icon: LightbulbIcon,
    tint: "bg-accent/10",
    tone: "text-accent",
  },
  {
    keywords: ["баг", "хамт олон", "манлайлал", "ажилтан", "гадаад төрх"],
    icon: UsersIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
  },
  {
    keywords: ["үйлчилгээ", "харилцагч", "үйлчлүүлэгч"],
    icon: HeartIcon,
    tint: "bg-brand-100",
    tone: "text-brand-700",
  },
];

const FALLBACKS = [
  { icon: BookIcon, tint: "bg-brand-50", tone: "text-brand-500" },
  { icon: BookIcon, tint: "bg-accent/10", tone: "text-accent" },
  { icon: BookIcon, tint: "bg-brand-100", tone: "text-brand-700" },
];

export function getCourseIcon(title: string, fallbackIndex = 0) {
  const lower = title.toLowerCase();
  const match = RULES.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword))
  );
  if (match) return match;
  return FALLBACKS[fallbackIndex % FALLBACKS.length];
}
