import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { isModuleVisible } from "@/lib/module-visibility";
import { CourseCurriculum } from "@/components/course-curriculum";
import { ArrowRightIcon, BookIcon } from "@/components/icons";

export default async function CourseCurriculumPage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect(`/login?redirect=/learn/${params.courseSlug}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("position")
    .eq("id", user.id)
    .single();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, slug, description, thumbnail_url, modules(id, title, position, visible_positions, category, lessons(id, title, position))"
    )
    .eq("slug", decodeURIComponent(params.courseSlug))
    .single();

  if (!course) notFound();

  const modules = (course as any).modules
    ?.filter((m: any) => isModuleVisible(m.visible_positions, profile?.position))
    .sort((a: any, b: any) => a.position - b.position);

  const categoryGroups: { category: string | null; modules: any[] }[] = [];
  for (const mod of modules || []) {
    const cat = mod.category || null;
    const sortedMod = {
      ...mod,
      lessons: [...(mod.lessons || [])].sort((a: any, b: any) => a.position - b.position),
    };
    const lastGroup = categoryGroups[categoryGroups.length - 1];
    if (lastGroup && lastGroup.category === cat) {
      lastGroup.modules.push(sortedMod);
    } else {
      categoryGroups.push({ category: cat, modules: [sortedMod] });
    }
  }

  const allLessons = (modules || []).flatMap((m: any) =>
    [...(m.lessons || [])].sort((a: any, b: any) => a.position - b.position)
  );

  if (allLessons.length === 0) notFound();

  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed")
    .eq("user_id", user.id)
    .eq("is_completed", true);

  const completedLessonIds = (progressRows || []).map((p) => p.lesson_id);
  const completedSet = new Set(completedLessonIds);

  const resumeLesson =
    allLessons.find((l: any) => !completedSet.has(l.id)) || allLessons[0];

  const total = allLessons.length;
  const completedCount = allLessons.filter((l: any) => completedSet.has(l.id)).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const started = completedCount > 0;
  const done = completedCount === total;

  return (
    <div>
      <div className="flex flex-col gap-6 rounded-lg border border-ink/10 bg-white p-6 sm:flex-row sm:items-center sm:p-7">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 sm:h-28 sm:w-28">
          {course.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <BookIcon className="h-10 w-10 text-brand-500/40" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-1.5 text-sm text-ink/60">{course.description}</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 w-full max-w-xs rounded-full bg-ink/5">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="flex-shrink-0 text-sm text-ink/50">
              {completedCount} / {total} хичээл дууссан
            </span>
          </div>
        </div>

        <Link
          prefetch={false}
          href={`/learn/${course.slug}/${resumeLesson.id}`}
          className="focus-ring inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
        >
          {done ? "Дахин үзэх" : started ? "Үргэлжлүүлэх" : "Эхлэх"}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-semibold text-ink">
        Сургалтын агуулга
      </h2>

      <CourseCurriculum
        courseSlug={course.slug}
        categoryGroups={categoryGroups}
        completedLessonIds={completedLessonIds}
        resumeLessonId={resumeLesson.id}
      />
    </div>
  );
}
