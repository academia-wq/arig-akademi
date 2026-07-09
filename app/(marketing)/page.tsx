import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, description, thumbnail_url, price")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main>
      <section className="border-b border-brand-100 bg-paper px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
            Ариг Академи
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
            Хөгжлөөр үйлчилнэ
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
            Видео хичээл, дадлага, явцын хяналт — бүгд нэг дор. Хаанаас ч,
            хэзээ ч суралц.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
            prefetch={false}
              href="/courses"
              className="focus-ring rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
            >
              Курсууд үзэх
            </Link>
            <Link
            prefetch={false}
              href="/register"
              className="focus-ring rounded-md border border-ink/15 px-6 py-3 font-medium text-ink transition hover:border-ink/30"
            >
              Бүртгүүлэх
            </Link>
          </div>
        </div>
      </section>

      {courses && courses.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-2xl font-bold text-ink">
            Шинэ курсууд
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {courses.map((course) => (
              <Link
            prefetch={false}
                key={course.id}
                href={`/courses/${course.slug}`}
                className="focus-ring group rounded-lg border border-ink/10 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
              >
                <div className="mb-4 aspect-video rounded-md bg-brand-50" />
                <h3 className="font-display font-bold text-ink group-hover:text-brand-700">
                  {course.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink/60">
                  {course.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-500">
                  {course.price > 0 ? `${course.price}₮` : "Үнэгүй"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
