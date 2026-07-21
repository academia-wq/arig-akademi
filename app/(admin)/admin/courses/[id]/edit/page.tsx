import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VideoUploader } from "@/components/video-uploader";
import { ImageUploader } from "@/components/image-uploader";
import { DocumentCourseBuilder } from "@/components/document-course-builder";
import { DeleteButton } from "@/components/delete-button";

async function updateCourseMeta(courseId: string, formData: FormData) {
  "use server";
  const supabase = createClient();
  await supabase
    .from("courses")
    .update({
      description: formData.get("description") as string,
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", courseId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

async function addModule(courseId: string, formData: FormData) {
  "use server";
  const supabase = createClient();
  const title = formData.get("module_title") as string;
  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  await supabase
    .from("modules")
    .insert({ course_id: courseId, title, position: count || 0 });
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

async function addLesson(moduleId: string, courseId: string, formData: FormData) {
  "use server";
  const supabase = createClient();
  const title = formData.get("lesson_title") as string;
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);

  await supabase
    .from("lessons")
    .insert({ module_id: moduleId, title, position: count || 0 });
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

async function updateModuleTitle(moduleId: string, courseId: string, formData: FormData) {
  "use server";
  const supabase = createClient();
  const title = formData.get("module_title") as string;
  await supabase.from("modules").update({ title }).eq("id", moduleId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

async function updateLessonContent(lessonId: string, courseId: string, formData: FormData) {
  "use server";
  const supabase = createClient();
  const title = formData.get("lesson_title") as string;
  const content_text = formData.get("content_text") as string;
  await supabase.from("lessons").update({ title, content_text }).eq("id", lessonId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

async function deleteLesson(lessonId: string, courseId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId);
  await supabase.from("lessons").delete().eq("id", lessonId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

async function deleteModule(moduleId: string, courseId: string) {
  "use server";
  const supabase = createClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId);
  const lessonIds = (lessons || []).map((l) => l.id);
  if (lessonIds.length) {
    await supabase.from("lesson_progress").delete().in("lesson_id", lessonIds);
  }
  await supabase.from("modules").delete().eq("id", moduleId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

export default async function EditCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, description, is_published, modules(id, title, position, lessons(id, title, content_text, mux_playback_id, mux_asset_id, image_url, position, is_free_preview))"
    )
    .eq("id", params.id)
    .single();

  if (!course) notFound();

  const modules = (course as any).modules?.sort(
    (a: any, b: any) => a.position - b.position
  );

  const updateMeta = updateCourseMeta.bind(null, course.id);
  const createModule = addModule.bind(null, course.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        {course.title}
      </h1>

      <form
        action={updateMeta}
        className="mt-6 space-y-4 rounded-lg border border-ink/10 bg-white p-4"
      >
        <div>
          <label className="block text-sm font-medium text-ink">
            Тайлбар
          </label>
          <textarea
            name="description"
            defaultValue={course.description || ""}
            rows={3}
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={course.is_published}
          />
          Нийтэд нээлттэй болгох
        </label>
        <button
          type="submit"
          className="focus-ring rounded-md bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Хадгалах
        </button>
      </form>

      {/* ANTHROPIC_API_KEY тохируулагдаагүй бол энэ хэсгийг нуух —
          key нэмэгдмэгц дахин автоматаар харагдана. */}
      {process.env.ANTHROPIC_API_KEY && (
        <DocumentCourseBuilder courseId={course.id} />
      )}

      <div className="mt-8 space-y-6">
        {modules?.map((mod: any) => {
          const createLesson = addLesson.bind(null, mod.id, course.id);
          const saveModuleTitle = updateModuleTitle.bind(null, mod.id, course.id);
          const removeModule = deleteModule.bind(null, mod.id, course.id);
          return (
            <div key={mod.id} className="rounded-lg border border-ink/10 bg-white p-4">
              <div className="flex gap-2">
                <form action={saveModuleTitle} className="flex flex-1 gap-2">
                  <input
                    name="module_title"
                    defaultValue={mod.title}
                    required
                    className="focus-ring flex-1 rounded-md border border-ink/15 px-2 py-1 font-display font-bold text-ink"
                  />
                  <button
                    type="submit"
                    className="focus-ring rounded-md border border-ink/15 px-3 py-1 text-sm font-medium hover:border-ink/30"
                  >
                    Хадгалах
                  </button>
                </form>
                <form action={removeModule}>
                  <DeleteButton confirmText={`"${mod.title}" бүлгийг устгах уу? Доторх бүх хичээл устна.`} />
                </form>
              </div>

              <ul className="mt-4 space-y-4">
                {mod.lessons
                  ?.sort((a: any, b: any) => a.position - b.position)
                  .map((lesson: any) => {
                    const saveLessonContent = updateLessonContent.bind(
                      null,
                      lesson.id,
                      course.id
                    );
                    const removeLesson = deleteLesson.bind(null, lesson.id, course.id);
                    return (
                    <li key={lesson.id} className="rounded-md border border-ink/10 p-3">
                      <form action={saveLessonContent} className="space-y-2">
                        <input
                          name="lesson_title"
                          defaultValue={lesson.title}
                          required
                          className="focus-ring w-full rounded-md border border-ink/15 px-2 py-1 text-sm font-medium text-ink"
                        />
                        <textarea
                          name="content_text"
                          defaultValue={lesson.content_text || ""}
                          rows={3}
                          placeholder="Хичээлийн агуулга..."
                          className="focus-ring w-full rounded-md border border-ink/15 px-2 py-1 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="focus-ring rounded-md border border-ink/15 px-3 py-1 text-sm font-medium hover:border-ink/30"
                          >
                            Хадгалах
                          </button>
                        </div>
                      </form>
                      <form action={removeLesson} className="mt-2">
                        <DeleteButton confirmText={`"${lesson.title}" хичээлийг устгах уу?`} />
                      </form>
                      <div className="mt-2">
                        {lesson.mux_playback_id ? (
                          <p className="text-sm text-accent">
                            ✓ Видео холбогдсон (playback: {lesson.mux_playback_id})
                          </p>
                        ) : (
                          <VideoUploader lessonId={lesson.id} />
                        )}
                      </div>
                      <div className="mt-2">
                        <ImageUploader
                          lessonId={lesson.id}
                          courseId={course.id}
                          imageUrl={lesson.image_url}
                        />
                      </div>
                    </li>
                    );
                  })}
              </ul>

              <form action={createLesson} className="mt-4 flex gap-2">
                <input
                  name="lesson_title"
                  placeholder="Шинэ хичээлийн нэр"
                  required
                  className="focus-ring flex-1 rounded-md border border-ink/15 px-3 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="focus-ring rounded-md border border-ink/15 px-3 py-1.5 text-sm font-medium hover:border-ink/30"
                >
                  Хичээл нэмэх
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <form action={createModule} className="mt-6 flex gap-2">
        <input
          name="module_title"
          placeholder="Шинэ бүлгийн нэр"
          required
          className="focus-ring flex-1 rounded-md border border-ink/15 px-3 py-2"
        />
        <button
          type="submit"
          className="focus-ring rounded-md bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Бүлэг нэмэх
        </button>
      </form>
    </div>
  );
}
