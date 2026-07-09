import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

async function enrollAction(courseId: string) {
  "use server";
  const supabase = createClient();
  const user = await getUser();

  if (!user) {
    redirect(`/login?redirect=/courses`);
  }

  // Анхаар: энэ бол зөвхөн ҮНЭГҮЙ курст зориулсан шууд элсэлт.
  // Төлбөртэй курст энэ функцийг Stripe Checkout руу чиглүүлэхээр сольж,
  // `enrollments` мөрийг Stripe webhook дотор амжилттай төлбөрийн дараа үүсгэнэ (4.4-р зүйл).
  const { error } = await supabase
    .from("enrollments")
    .insert({ user_id: user!.id, course_id: courseId });

  if (error && error.code !== "23505" /* аль хэдийн элссэн бол алгасна */) {
    throw new Error(error.message);
  }

  redirect(`/learn/${courseId}`);
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, description, price, is_published, modules(id, title, position, lessons(id, title, is_free_preview, position))"
    )
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!course) notFound();

  const enroll = enrollAction.bind(null, course.id);
  const modules = (course as any).modules?.sort(
    (a: any, b: any) => a.position - b.position
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">
        {course.title}
      </h1>
      <p className="mt-4 text-ink/70">{course.description}</p>

      <form action={enroll} className="mt-8">
        <button
          type="submit"
          className="focus-ring rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
        >
          {course.price > 0 ? `${course.price}₮ — Худалдаж авах` : "Үнэгүй элсэх"}
        </button>
      </form>

      <div className="mt-12">
        <h2 className="font-display text-xl font-bold text-ink">
          Хөтөлбөр
        </h2>
        <div className="mt-4 space-y-4">
          {modules?.map((mod: any) => (
            <div key={mod.id} className="rounded-lg border border-ink/10 p-4">
              <h3 className="font-medium text-ink">{mod.title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-ink/60">
                {mod.lessons
                  ?.sort((a: any, b: any) => a.position - b.position)
                  .map((lesson: any) => (
                    <li key={lesson.id} className="flex items-center gap-2">
                      <span>{lesson.title}</span>
                      {lesson.is_free_preview && (
                        <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                          Үнэгүй үзэх
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
