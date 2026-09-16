import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRightCircleIcon,
  WorkItemIcon,
  GraphUpArrowIcon,
  GlobeIcon,
} from "@/components/icons";

// Тэдгээр эх Figma asset-уудыг тэнхлэгээр нь дүрсэлсэн тул зарим нь
// босоогоор нь эргүүлж харуулах шаардлагатай (эх loyout-той адилхан байлгах).
const PATTERN_ICONS = [
  { src: "/icons/pattern-1.svg", flip: true },
  { src: "/icons/pattern-2.svg", flip: false },
  { src: "/icons/pattern-3.svg", flip: true },
  { src: "/icons/pattern-4.svg", flip: true },
  { src: "/icons/pattern-5.svg", flip: true },
  { src: "/icons/pattern-6.svg", flip: true },
  { src: "/icons/pattern-7.svg", flip: false },
  { src: "/icons/pattern-8.svg", flip: true },
];

const FEATURES = [
  {
    icon: WorkItemIcon,
    title: "Практик агуулга",
    description:
      "Онолоос илүү бодит ажил дээр хэрэглэх боломжтой мэдлэг, ур чадварт төвлөрсөн сургалтууд.",
  },
  {
    icon: GraphUpArrowIcon,
    title: "Ахиц дэвшлээ хянах",
    description: "Level, дуусгасан хичээлийн тоогоор өөрийн ахицыг бодитоор хардаг.",
  },
  {
    icon: GlobeIcon,
    title: "Хаанаас ч, хэзээ ч",
    description:
      "Ажлын завсарлагаараа, гэртээ, зорчиж яваа үедээ — өөрт тохирсон цагаараа суралц.",
  },
];

export default async function HomePage() {
  const supabase = createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, modules(id, lessons(id))")
    .eq("is_published", true);

  const activeCourses = courses?.length || 0;
  const totalModules = (courses || []).reduce(
    (sum: number, c: any) => sum + (c.modules?.length || 0),
    0
  );
  const totalLessons = (courses || []).reduce(
    (sum: number, c: any) =>
      sum + (c.modules || []).reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0),
    0
  );

  const stats = [
    { label: "Идэвхтэй сургалт", value: `${activeCourses}+` },
    { label: "Нийт хичээл", value: `${totalLessons}+` },
    { label: "Сургалтын агуулга", value: `${totalModules}+` },
  ];

  return (
    <div>
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Ариг <span className="text-brand-500">академи</span>
          </h1>
          <p className="mt-2 font-display text-2xl font-medium text-ink sm:text-4xl">
            Хөгжлөөр үйлчилнэ
          </p>
          <p className="mt-5 max-w-md text-ink/50">
            Ажилтнуудынхаа мэдлэг, ур чадварыг тасралтгүй хөгжүүлэх цахим
            сургалтын платформ.
          </p>

          <Link
            prefetch={false}
            href="/learn"
            className="focus-ring mt-8 inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700"
          >
            Сургалт үзэх
            <ArrowRightCircleIcon className="h-4 w-4" />
          </Link>

          <div className="mt-10 flex flex-wrap gap-0">
            {PATTERN_ICONS.map((icon) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={icon.src}
                src={icon.src}
                alt=""
                className={`h-12 w-12 opacity-70 ${icon.flip ? "-scale-y-100" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="relative mx-auto aspect-[576/671] w-full max-w-sm overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/home-hero.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-3 divide-x divide-paper rounded-2xl bg-ink px-6 py-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-3xl font-bold tracking-wide text-paper">
              {stat.value}
            </p>
            <p className="mt-1.5 text-ink/40 sm:text-base">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="font-display text-2xl text-brand-500">Яагаад Ариг Академи</p>
        <p className="mt-2 text-xl text-ink">Суралцахад хялбар, ахицад төвлөрсөн</p>

        <div className="mt-10 grid gap-10 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <div className="flex h-16 w-16 items-center justify-center border-[1.5px] border-brand-500">
                <feature.icon className="h-8 w-8 text-brand-500" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
