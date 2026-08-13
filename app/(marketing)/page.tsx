import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/course-card";
import { formatDuration } from "@/lib/format";
import {
  ArrowRightIcon,
  BookIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@/components/icons";

export default async function HomePage() {
  const supabase = createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, title, slug, thumbnail_url, modules(lessons(duration_seconds))"
    )
    .eq("is_published", true)
    .limit(6);

  const featuredCourses = (courses || []).map((course: any) => {
    const durationSeconds = (course.modules || []).reduce(
      (sum: number, m: any) =>
        sum +
        (m.lessons || []).reduce(
          (s: number, l: any) => s + (l.duration_seconds || 0),
          0
        ),
      0
    );
    return { ...course, durationSeconds };
  });

  const totalLessons = featuredCourses.reduce((sum, c) => {
    const count = (c.modules || []).reduce(
      (s: number, m: any) => s + (m.lessons || []).length,
      0
    );
    return sum + count;
  }, 0);
  const totalSeconds = featuredCourses.reduce(
    (sum, c) => sum + c.durationSeconds,
    0
  );

  const stats = [
    { label: "Идэвхтэй сургалт", value: `${featuredCourses.length}+` },
    { label: "Нийт хичээл", value: `${totalLessons}+` },
    {
      label: "Сургалтын агуулга",
      value: formatDuration(totalSeconds) || "Тун удахгүй",
    },
  ];

  const features = [
    {
      icon: BookIcon,
      title: "Практик агуулга",
      description:
        "Онолоос илүү бодит ажил дээр хэрэглэх боломжтой мэдлэг, ур чадварт төвлөрсөн сургалтууд.",
    },
    {
      icon: CheckCircleIcon,
      title: "Ахиц дэвшлээ хянах",
      description:
        "Level, дуусгасан хичээлийн тоогоор өөрийн ахицыг бодитоор хардаг.",
    },
    {
      icon: ClockIcon,
      title: "Хаанаас ч, хэзээ ч",
      description:
        "Ажлын завсарлагаараа, гэртээ, зорчиж яваа үедээ — өөрт тохирсон цагаараа суралц.",
    },
  ];

  return (
    <main>
      <section className="border-b border-brand-100 bg-brand-50 px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div className="text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
              Ариг Академи
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-6xl">
              Хөгжлөөр үйлчилнэ
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg text-ink/70 md:mx-0">
              Ажилтнуудынхаа мэдлэг, ур чадварыг тасралтгүй хөгжүүлэх
              цахим сургалтын платформ.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:justify-start">
              <Link
                prefetch={false}
                href="/#courses"
                className="focus-ring inline-flex items-center gap-2 rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
              >
                Сургалт үзэх
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                prefetch={false}
                href="/register"
                className="focus-ring rounded-md border border-ink/15 bg-white px-6 py-3 font-medium text-ink transition hover:border-ink/30"
              >
                Бүртгүүлэх
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl shadow-lg md:max-w-none">
            <Image
              src="/hero-illustration.png"
              alt="Ариг Аня"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white px-6 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-semibold text-ink md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-ink/50 md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="courses" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
              Онцлох
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
              Сургалтууд
            </h2>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  slug={course.slug}
                  title={course.title}
                  thumbnailUrl={course.thumbnail_url}
                  durationSeconds={course.durationSeconds}
                  progress={0}
                  tintIndex={i}
                  href={`/courses/${course.slug}`}
                  eyebrow="Сургалт"
                  ctaLabel="Дэлгэрэнгүй"
                />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-center text-ink/50">
              Тун удахгүй шинэ сургалтууд нэмэгдэнэ.
            </p>
          )}
        </div>
      </section>

      <section id="about" className="border-y border-ink/10 bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
              Яагаад Ариг Академи
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
              Суралцахад хялбар, ахицад төвлөрсөн
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="text-center sm:text-left">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 sm:mx-0">
                  <feature.icon className="h-5 w-5 text-brand-500" />
                </div>
                <h3 className="mt-4 font-display font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-ink/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center rounded-2xl border border-brand-100 bg-brand-50 px-8 py-14 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">
            Өнөөдрөөс суралцаж эхлээрэй
          </h2>
          <p className="mt-3 max-w-md text-ink/70">
            Бүртгэл үнэ төлбөргүй. Хэдхэн минутын дотор эхний хичээлээ үзээрэй.
          </p>
          <Link
            prefetch={false}
            href="/register"
            className="focus-ring mt-6 inline-flex items-center gap-2 rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
          >
            Үнэгүй бүртгүүлэх
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
