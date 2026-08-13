import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function createCourse(formData: FormData) {
  "use server";
  const supabase = createClient();
  const user = await getUser();
  if (!user) return;

  const title = formData.get("title") as string;
  const price = Number(formData.get("price") || 0);

  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug: slugify(title),
      price,
      instructor_id: user.id,
      is_published: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/admin/courses/${data.id}/edit`);
}

export default async function AdminCoursesPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/admin/courses");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, is_published, price")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Миний курсууд
      </h1>

      <form
        action={createCourse}
        className="mt-6 flex items-end gap-3 rounded-lg border border-ink/10 bg-white p-4"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink">
            Шинэ курсын нэр
          </label>
          <input
            name="title"
            required
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">
            Үнэ (₮)
          </label>
          <input
            name="price"
            type="number"
            defaultValue={0}
            className="focus-ring mt-1 w-32 rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="focus-ring rounded-md bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          Үүсгэх
        </button>
      </form>

      <div className="mt-6 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white">
        {courses?.map((course) => (
          <Link
            prefetch={false}
            key={course.id}
            href={`/admin/courses/${course.id}/edit`}
            className="focus-ring flex items-center justify-between px-4 py-3 hover:bg-ink/5"
          >
            <span className="font-medium text-ink">{course.title}</span>
            <span className="flex items-center gap-3 text-sm text-ink/50">
              {course.price > 0 ? `${course.price}₮` : "Үнэгүй"}
              <span
                className={
                  course.is_published
                    ? "rounded-sm bg-accent/10 px-2 py-0.5 text-accent"
                    : "rounded-sm bg-ink/10 px-2 py-0.5"
                }
              >
                {course.is_published ? "Нийтэлсэн" : "Ноорог"}
              </span>
            </span>
          </Link>
        ))}
        {courses?.length === 0 && (
          <p className="px-4 py-6 text-center text-ink/50">Курс алга байна.</p>
        )}
      </div>
    </div>
  );
}
