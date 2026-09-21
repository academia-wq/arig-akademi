import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { LessonPlayer } from "@/components/lesson-player";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { LessonTabs } from "@/components/lesson-tabs";
import { LessonCurriculumList } from "@/components/lesson-curriculum-list";
import { ProgressRing } from "@/components/progress-ring";
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

  const materials = allLessons.flatMap((l: any) =>
    (l.material_urls || []).map((url: string) => ({ lessonTitle: l.title, url }))
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <main className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm text-ink/50">
          <Link prefetch={false} href="/learn" className="focus-ring hover:text-brand-500">
            Миний сургалт
          </Link>
          <span>/</span>
          <Link
            prefetch={false}
            href={`/learn/${course.slug}`}
            className="focus-ring hover:text-brand-500"
          >
            {course.title}
          </Link>
        </div>

        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
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
        ) : currentLesson.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentLesson.image_url}
            alt={currentLesson.title}
            className="mt-6 max-w-full rounded-lg border border-ink/10"
          />
        ) : (
          (() => {
            const courseIcon = getCourseIcon(course.title);
            return (
              <div
                className={`mt-6 flex h-40 items-center justify-center rounded-lg ${courseIcon.tint}`}
              >
                {courseIcon.illustration ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={courseIcon.illustration}
                    alt=""
                    className="h-full max-w-xs object-contain p-3"
                  />
                ) : (
                  <courseIcon.icon className={`h-14 w-14 ${courseIcon.tone}`} />
                )}
              </div>
            );
          })()
        )}

        {course.description && (
          <p className="mt-6 text-sm text-ink/60">{course.description}</p>
        )}

        <div className="mt-8">
          <LessonTabs
            tabs={[
              {
                label: "Модулиуд",
                content: (
                  <LessonCurriculumList
                    courseSlug={course.slug}
                    modules={modules}
                    currentLessonId={currentLesson.id}
                    completedLessonIds={completedLessonIds}
                  />
                ),
              },
              {
                label: "Тойм",
                content: currentLesson.content_text ? (
                  <article className="prose prose-neutral max-w-none whitespace-pre-line text-sm text-ink/80">
                    {currentLesson.content_text}
                  </article>
                ) : (
                  <p className="text-sm text-ink/50">Энэ хичээлд тойм мэдээлэл алга байна.</p>
                ),
              },
              {
                label: "Нөөцүүд",
                content:
                  materials.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {materials.map((m: { lessonTitle: string; url: string }) => (
                        <li key={m.url}>
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="focus-ring flex items-center gap-2 text-sm text-brand-500 hover:underline"
                          >
                            {decodeURIComponent(m.url.split("/").pop() || m.url)}
                            <span className="text-ink/40">— {m.lessonTitle}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink/50">Одоогоор материал хавсаргаагүй байна.</p>
                  ),
              },
              {
                label: "Хэлэлцүүлэг",
                content: (
                  <p className="text-sm text-ink/50">Энэ хэсэг тун удахгүй нэмэгдэнэ.</p>
                ),
              },
            ]}
          />
        </div>
      </main>

      <aside className="flex flex-col gap-5">
        <div className="rounded-2xl border border-ink/15 bg-white p-5">
          <p className="text-sm font-medium text-ink">Таны явц</p>
          <div className="mt-4 flex items-center justify-center">
            <ProgressRing percent={percent} />
          </div>
          {!currentProgress?.is_completed && (
            <p className="mt-4 text-center text-xs text-ink/50">
              {nextLesson
                ? `Дараагийн: ${nextLesson.title}`
                : "Энэ бол сүүлийн хичээл"}
            </p>
          )}
          {!currentLesson.mux_playback_id && (
            <MarkCompleteButton
              lessonId={currentLesson.id}
              initiallyCompleted={currentProgress?.is_completed || false}
              label="Хичээлийг дуусгах"
              className="mt-4"
            />
          )}
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
              <span className="font-medium text-ink">{totalLessons} хичээл</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {prevLesson ? (
            <Link
              prefetch={false}
              href={`/learn/${course.slug}/${prevLesson.id}`}
              className="focus-ring flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-center text-sm font-medium text-ink transition hover:border-ink/30"
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
