import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const supabase = createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, thumbnail_url, price")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">
        Бүх курс
      </h1>

      {error && (
        <p className="mt-6 text-sm text-red-600">
          Курсуудыг ачаалахад алдаа гарлаа: {error.message}
        </p>
      )}

      {!error && courses?.length === 0 && (
        <p className="mt-6 text-ink/60">Одоогоор нийтлэгдсэн курс алга.</p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {courses?.map((course) => (
          <Link
            prefetch={false}
            key={course.id}
            href={`/courses/${course.slug}`}
            className="focus-ring group rounded-lg border border-ink/10 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
          >
            <div className="mb-4 aspect-video rounded-md bg-brand-50" />
            <h2 className="font-display font-bold text-ink group-hover:text-brand-700">
              {course.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-ink/60">
              {course.description}
            </p>
            <p className="mt-4 text-sm font-semibold text-brand-500">
              {course.price > 0 ? `${course.price}₮` : "Үнэгүй"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
