import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { CourseCard } from "@/components/course-card";
import { computeCourseProgress } from "@/lib/course-progress";

export default async function LearnCoursesPage() {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect("/login?redirect=/learn");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, slug, description, thumbnail_url)")
    .eq("user_id", user.id);

  let courses = (enrollments || [])
    .map((e: any) => e.courses)
    .filter(Boolean);

  // Хэрэглэгч ямар ч курст элсээгүй бол одоо байгаа үнэгүй курсуудад
  // автоматаар элсүүлнэ.
  if (courses.length === 0) {
    const { data: freeCourses } = await supabase
      .from("courses")
      .select("id, title, slug, description, thumbnail_url")
      .eq("is_published", true)
      .eq("price", 0);

    if (freeCourses && freeCourses.length > 0) {
      await supabase
        .from("enrollments")
        .upsert(
          freeCourses.map((c) => ({ user_id: user.id, course_id: c.id })),
          { onConflict: "user_id,course_id", ignoreDuplicates: true }
        );
      courses = freeCourses;
    }
  }

  const coursesWithProgress = await Promise.all(
    courses.map((course: any) => computeCourseProgress(supabase, user.id, course))
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Миний сургалтууд
      </h1>

      {coursesWithProgress.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-ink/20 p-10 text-center">
          <p className="text-ink/60">Та одоогоор ямар ч курст элсээгүй байна.</p>
          <Link
            prefetch={false}
            href="/dashboard"
            className="focus-ring mt-4 inline-block font-medium text-brand-500"
          >
            Нүүр рүү буцах →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coursesWithProgress.map(({ course, progress, durationSeconds }, i) => (
            <CourseCard
              key={course.id}
              slug={course.slug}
              title={course.title}
              thumbnailUrl={course.thumbnail_url}
              durationSeconds={durationSeconds}
              progress={progress}
              tintIndex={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
