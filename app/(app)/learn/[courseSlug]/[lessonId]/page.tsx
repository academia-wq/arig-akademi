import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import clsx from "clsx";
import { createClient, getUser } from "@/lib/supabase/server";
import { LessonPlayer } from "@/components/lesson-player";

export default async function LessonPage({
  params,
}: {
  params: { courseSlug: string; lessonId: string };
}) {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect(`/login?redirect=/learn/${params.courseSlug}/${params.lessonId}`);

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, slug, modules(id, title, position, lessons(id, title, content_text, mux_playback_id, position))"
    )
    .eq("slug", params.courseSlug)
    .single();

  if (!course) notFound();

  const modules = (course as any).modules?.sort(
    (a: any, b: any) => a.position - b.position
  );

  const currentLesson = modules
    ?.flatMap((m: any) => m.lessons)
    .find((l: any) => l.id === params.lessonId);

  if (!currentLesson) notFound();

  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed, last_position_seconds")
    .eq("user_id", user.id);

  const progressByLesson = new Map(
    (progressRows || []).map((p) => [p.lesson_id, p])
  );

  const currentProgress = progressByLesson.get(currentLesson.id);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
      <aside className="order-2 md:order-1">
        <nav className="space-y-6">
          {modules?.map((mod: any) => (
            <div key={mod.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
                {mod.title}
              </p>
              <ul className="space-y-1">
                {mod.lessons
                  ?.sort((a: any, b: any) => a.position - b.position)
                  .map((lesson: any) => {
                    const done = progressByLesson.get(lesson.id)?.is_completed;
                    const active = lesson.id === currentLesson.id;
                    return (
                      <li key={lesson.id}>
                        <Link
            prefetch={false}
                          href={`/learn/${course.slug}/${lesson.id}`}
                          className={clsx(
                            "focus-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                            active
                              ? "bg-brand-50 font-medium text-brand-700"
                              : "text-ink/70 hover:bg-ink/5"
                          )}
                        >
                          <span
                            className={clsx(
                              "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                              done ? "bg-accent" : "bg-ink/20"
                            )}
                          />
                          {lesson.title}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="order-1 md:order-2">
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

        {currentLesson.content_text && (
          <article className="prose prose-neutral mt-8 max-w-none">
            {currentLesson.content_text}
          </article>
        )}
      </main>
    </div>
  );
}
