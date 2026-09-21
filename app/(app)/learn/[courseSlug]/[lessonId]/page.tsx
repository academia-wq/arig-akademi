import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { LessonPlayer } from "@/components/lesson-player";
import { CompleteModuleButton } from "@/components/complete-module-button";
import { LessonCurriculumList } from "@/components/lesson-curriculum-list";
import { ProgressRing } from "@/components/progress-ring";
import { ChevronRightIcon } from "@/components/icons";
import { isModuleVisible } from "@/lib/module-visibility";
import { getCourseIcon } from "@/lib/course-icon";
import { formatDuration } from "@/lib/format";

export default async function LessonPage({
  params,
}: {
  params: { courseSlug: string; lessonId: string };
}) {
  const supabase = createClient();
  const user = await getUser();
  if (!user) redirect(`/login?redirect=/learn/${params.courseSlug}/${params.lessonId}`);

  const [{ data: profile }, { data: course }, { data: progressRows }] = await Promise.all([
    supabase.from("profiles").select("position").eq("id", user.id).single(),
    supabase
      .from("courses")
      .select(
        "id, title, slug, description, thumbnail_url, modules(id, title, position, visible_positions, category, lessons(id, title, content_text, mux_playback_id, image_url, material_urls, duration_seconds, position))"
      )
      .eq("slug", decodeURIComponent(params.courseSlug))
      .single(),
    supabase
      .from("lesson_progress")
      .select("lesson_id, is_completed, last_position_seconds")
      .eq("user_id", user.id),
  ]);

  if (!course) notFound();

  const modules = ((course as any).modules || [])
    .filter((m: any) => isModuleVisible(m.visible_positions, profile?.position))
    .sort((a: any, b: any) => a.position - b.position)
    .map((mod: any) => ({
      ...mod,
      lessons: [...(mod.lessons || [])].sort((a: any, b: any) => a.position - b.position),
    }));

  const allLessons = modules.flatMap((m: any) => m.lessons);
  const currentLesson = allLessons.find((l: any) => l.id === params.lessonId);

  if (!currentLesson) notFound();

  const currentIndex = allLessons.findIndex((l: any) => l.id === params.lessonId);
  const prevLesson = allLessons[currentIndex - 1];
  const nextLesson = allLessons[currentIndex + 1];
  const currentModule = modules.find((m: any) =>
    m.lessons.some((l: any) => l.id === params.lessonId)
  );

  const progressByLesson = new Map((progressRows || []).map((p) => [p.lesson_id, p]));
  const currentProgress = progressByLesson.get(currentLesson.id);

  const completedLessonIds = (progressRows || [])
    .filter((p) => p.is_completed)
    .map((p) => p.lesson_id);
  const completedSet = new Set(completedLessonIds);

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l: any) => completedSet.has(l.id)).length;
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const totalDuration = formatDuration(
    allLessons.reduce((sum: number, l: any) => sum + (l.duration_seconds || 0), 0)
  );
  const moduleCompleted =
    currentModule.lessons.length > 0 &&
    currentModule.lessons.every((l: any) => completedSet.has(l.id));

  const materials: string[] = currentLesson.material_urls || [];
  const description = currentLesson.content_text || course.description;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <main className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-ink/50">
          <Link prefetch={false} href="/learn" className="focus-ring hover:text-brand-500">
            Миний сургалт
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <Link
            prefetch={false}
            href={`/learn/${course.slug}`}
            className="focus-ring truncate text-ink hover:text-brand-500"
          >
            {course.title}
          </Link>
        </div>

        <div className="mt-5">
          {currentLesson.mux_playback_id ? (
            <LessonPlayer
              lessonId={currentLesson.id}
              playbackId={currentLesson.mux_playback_id}
              startTime={currentProgress?.last_position_seconds || 0}
              initiallyCompleted={currentProgress?.is_completed || false}
            />
          ) : currentLesson.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentLesson.image_url}
              alt={currentLesson.title}
              className="aspect-video w-full rounded-xl border border-ink/10 object-cover"
            />
          ) : (
            (() => {
              const courseIcon = getCourseIcon(course.title);
              return (
                <div
                  className={`flex aspect-video w-full items-center justify-center rounded-xl ${courseIcon.tint}`}
                >
                  {courseIcon.illustration ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={courseIcon.illustration}
                      alt=""
                      className="h-full max-h-[70%] object-contain"
                    />
                  ) : (
                    <courseIcon.icon className={`h-16 w-16 ${courseIcon.tone}`} />
                  )}
                </div>
              );
            })()
          )}
        </div>

        <h1 className="mt-6 font-display text-xl font-semibold text-ink">
          {currentLesson.title}
        </h1>

        {description && (
          <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{description}</p>
        )}

        {materials.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1.5">
            {materials.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring text-sm text-brand-500 hover:underline"
                >
                  {decodeURIComponent(url.split("/").pop() || url)}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-b border-ink/10">
          <span className="-mb-px inline-block border-b-2 border-brand-500 py-3 text-sm font-medium text-brand-500">
            Модулиуд
          </span>
        </div>

        <div className="mt-5">
          <LessonCurriculumList
            courseSlug={course.slug}
            modules={modules}
            currentLessonId={currentLesson.id}
            completedLessonIds={completedLessonIds}
          />
        </div>
      </main>

      <aside className="flex flex-col gap-5">
        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <p className="text-sm font-medium text-ink">Таны явц</p>
          <div className="mt-4 flex items-center justify-center">
            <ProgressRing percent={percent} />
          </div>
          <p className="mt-4 text-xs text-ink/50">
            {nextLesson ? `Дараагийн: ${nextLesson.title}` : "Энэ бол сүүлийн хичээл"}
          </p>
          <CompleteModuleButton
            moduleId={currentModule.id}
            courseSlug={course.slug}
            initiallyCompleted={moduleCompleted}
          />
        </div>

        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <p className="text-sm font-medium text-ink">Сургалтын дэлгэрэнгүй</p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            {totalDuration && (
              <div className="flex items-center justify-between">
                <span className="text-ink/50">Хугацаа</span>
                <span className="font-medium text-ink">{totalDuration}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-ink/50">Хичээлүүд</span>
              <span className="font-medium text-ink">{totalLessons} Хичээл</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {prevLesson ? (
            <Link
              prefetch={false}
              href={`/learn/${course.slug}/${prevLesson.id}`}
              className="focus-ring flex-1 rounded-md border border-[#8A9DA2] px-4 py-2.5 text-center text-sm font-medium text-[#8A9DA2] transition hover:border-ink hover:text-ink"
            >
              Өмнөх
            </Link>
          ) : (
            <span className="flex-1 rounded-md border border-ink/10 px-4 py-2.5 text-center text-sm font-medium text-ink/30">
              Өмнөх
            </span>
          )}
          {nextLesson ? (
            <Link
              prefetch={false}
              href={`/learn/${course.slug}/${nextLesson.id}`}
              className="focus-ring flex-1 rounded-md bg-brand-500 px-4 py-2.5 text-center text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700"
            >
              Дараагийн хичээл
            </Link>
          ) : (
            <span className="flex-1 rounded-md bg-ink/10 px-4 py-2.5 text-center text-sm font-medium text-ink/30">
              Дараагийн хичээл
            </span>
          )}
        </div>
      </aside>
    </div>
  );
}
