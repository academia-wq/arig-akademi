import {
  BookIcon,
  CartIcon,
  ChatBubbleIcon,
  ClipboardListIcon,
  DeviceIcon,
  HeartIcon,
  LightbulbIcon,
  PackageIcon,
  PhoneIcon,
  RepeatIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";

const RULES: {
  keywords: string[];
  icon: typeof BookIcon;
  tint: string;
  tone: string;
  illustration?: string;
}[] = [
  {
    keywords: ["цэвэрлэгээ", "орчин", "эрүүл ахуй", "хог"],
    icon: SparklesIcon,
    tint: "bg-accent/10",
    tone: "text-accent",
    illustration: "/illustrations/hygiene.svg",
  },
  {
    keywords: ["харилцаа", "утас", "утсаар", "яриа"],
    icon: PhoneIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
    illustration: "/illustrations/phone.svg",
  },
  {
    keywords: ["ёс зүй", "стандарт", "дүрэм", "журам", "аюулгүй"],
    icon: ShieldCheckIcon,
    tint: "bg-brand-100",
    tone: "text-brand-700",
    illustration: "/illustrations/standard.svg",
  },
  {
    keywords: ["шийдвэр", "менежмент", "төлөвлөгөө", "төлөвлөлт"],
    icon: LightbulbIcon,
    tint: "bg-accent/10",
    tone: "text-accent",
    illustration: "/illustrations/management.svg",
  },
  {
    keywords: ["баг", "хамт олон", "манлайлал", "ажилтан", "гадаад төрх"],
    icon: UsersIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
    illustration: "/illustrations/team.svg",
  },
  {
    keywords: ["үйлчилгээ", "харилцагч", "үйлчлүүлэгч"],
    icon: HeartIcon,
    tint: "bg-brand-100",
    tone: "text-brand-700",
    illustration: "/illustrations/customer-service.svg",
  },
  {
    keywords: ["мэндчил"],
    icon: ChatBubbleIcon,
    tint: "bg-accent/10",
    tone: "text-accent",
  },
  {
    keywords: ["давтан"],
    icon: RepeatIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
  },
  {
    keywords: ["үнэ", "үнийн"],
    icon: TagIcon,
    tint: "bg-brand-100",
    tone: "text-brand-700",
  },
  {
    keywords: ["хүлээн авах", "бэлэн"],
    icon: PackageIcon,
    tint: "bg-accent/10",
    tone: "text-accent",
  },
  {
    keywords: ["апп", "аппликейшн"],
    icon: DeviceIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
  },
  {
    keywords: ["хуудс", "маягт"],
    icon: ClipboardListIcon,
    tint: "bg-brand-100",
    tone: "text-brand-700",
  },
  {
    keywords: ["захиалга"],
    icon: CartIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
  },
];

const FALLBACKS = [
  {
    icon: BookIcon,
    tint: "bg-brand-50",
    tone: "text-brand-500",
    illustration: "/illustrations/learning-1.svg",
  },
  {
    icon: BookIcon,
    tint: "bg-accent/10",
    tone: "text-accent",
    illustration: "/illustrations/learning-2.svg",
  },
  {
    icon: BookIcon,
    tint: "bg-brand-100",
    tone: "text-brand-700",
    illustration: "/illustrations/learning-3.svg",
  },
];

export function getCourseIcon(title: string, fallbackIndex = 0) {
  const lower = title.toLowerCase();
  const match = RULES.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword))
  );
  if (match) return match;
  return FALLBACKS[fallbackIndex % FALLBACKS.length];
}

// Бүх сэдвийн зурагтай хувилбарууд нэг сан болгож нэгтгэв. Нэг модулийн
// хичээлүүдийн нэрэнд ихэвчлэн ижил түлхүүр үг (жишээ нь "үйлчилгээ")
// давтагддаг тул keyword-matching энд ашиггүй — index-ээр цэвэр эргэлдүүлж,
// ойролцоо мөрүүд ялгаатай зурагтай гарахыг баталгаажуулна.
const ILLUSTRATED_VARIANTS = [
  ...RULES.filter((rule) => rule.illustration),
  ...FALLBACKS,
];

export function getLessonIllustration(index = 0) {
  return ILLUSTRATED_VARIANTS[index % ILLUSTRATED_VARIANTS.length];
}
