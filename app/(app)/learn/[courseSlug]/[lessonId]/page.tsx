import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { LessonPlayer } from "@/components/lesson-player";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { isModuleVisible } from "@/lib/module-visibility";

export default async function LessonPage({
  params,
}: {
  params: { courseSlug: string; lessonId: string };
}) {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect(`/login?redirect=/learn/${params.courseSlug}/${params.lessonId}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("position")
    .eq("id", user.id)
    .single();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, slug, modules(id, title, position, visible_positions, category, lessons(id, title, content_text, mux_playback_id, image_url, position))"
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

  const currentLesson = allLessons.find((l: any) => l.id === params.lessonId);

  if (!currentLesson) notFound();

  const currentIndex = allLessons.findIndex((l: any) => l.id === params.lessonId);
  const nextLesson = allLessons[currentIndex + 1];

  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed, last_position_seconds")
    .eq("user_id", user.id);

  const progressByLesson = new Map(
    (progressRows || []).map((p) => [p.lesson_id, p])
  );

  const currentProgress = progressByLesson.get(currentLesson.id);

  const completedLessonIds = (progressRows || [])
    .filter((p) => p.is_completed)
    .map((p) => p.lesson_id);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
      <aside className="order-2 md:order-1">
        <LessonSidebar
          courseSlug={course.slug}
          categoryGroups={categoryGroups}
          currentLessonId={currentLesson.id}
          completedLessonIds={completedLessonIds}
        />
      </aside>

      <main className="order-1 md:order-2">
        <Link
          prefetch={false}
          href={`/learn/${course.slug}`}
          className="focus-ring mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-brand-500"
        >
          ← Сургалтын агуулга руу буцах
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink">
          {currentLesson.title}
        </h1>

        {currentLesson.mux_playback_id ? (
          <div className="mt-6">
            <LessonPlayer
              lessonId={currentLesson.id}
              playbackId={currentLesson.mux_playback_id}
              startTime={currentProgress?.last_position_seconds || 0}
              initiallyCompleted={currentProgress?.is_completed || false}
            />
          </div>
        ) : (
          <p className="mt-6 text-ink/50">Энэ хичээлд видео алга.</p>
        )}

        {currentLesson.image_url && (
          <img
            src={currentLesson.image_url}
            alt={currentLesson.title}
            className="mt-6 max-w-full rounded-lg border border-ink/10"
          />
        )}

        {currentLesson.content_text && (
          <article className="prose prose-neutral mt-8 max-w-none">
            {currentLesson.content_text}
          </article>
        )}

        {!currentLesson.mux_playback_id && (
          <MarkCompleteButton
            lessonId={currentLesson.id}
            initiallyCompleted={currentProgress?.is_completed || false}
          />
        )}

        {nextLesson && (
          <div className="mt-8 border-t border-ink/10 pt-6">
            <Link
              prefetch={false}
              href={`/learn/${course.slug}/${nextLesson.id}`}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Дараагийн хичээл: {nextLesson.title} →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
