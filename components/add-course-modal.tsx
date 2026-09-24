"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon, PlusIcon } from "@/components/icons";
import { createModuleWithLesson } from "@/app/(app)/admin/actions";
import { VideoUploader } from "@/components/video-uploader";
import { ImageUploader } from "@/components/image-uploader";
import { PdfMaterialUploader } from "@/components/pdf-material-uploader";

export const CATEGORIES = [
  "Менежмент",
  "Санхүу",
  "Технологи",
  "Гал тогоо",
  "Харилцагчийн үйлчилгээ",
  "Аюулгүй байдал",
];

export function AddCourseButton({ courses }: { courses: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [addingNewCourse, setAddingNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [lessonCount, setLessonCount] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  } | null>(null);

  function close() {
    setOpen(false);
    setError(null);
    setCreated(null);
    setCourseId("");
    setAddingNewCourse(false);
    setNewCourseTitle("");
    setModuleTitle("");
    setCategory(CATEGORIES[0]);
    setLessonCount("");
    setDuration("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) {
      setError("Сургалтын нэрээ оруулна уу.");
      return;
    }
    if (!addingNewCourse && !courseId) {
      setError("Бүлгээ сонгоно уу.");
      return;
    }
    if (addingNewCourse && !newCourseTitle.trim()) {
      setError("Шинэ бүлгийн нэрээ оруулна уу.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    if (addingNewCourse) formData.set("newCourseTitle", newCourseTitle.trim());
    else formData.set("courseId", courseId);
    formData.set("moduleTitle", moduleTitle.trim());
    formData.set("category", category);
    formData.set("duration", duration);
    formData.set("lessonCount", lessonCount);

    const result = await createModuleWithLesson(formData);
    setSubmitting(false);
    if (result.success) {
      setCreated(result);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  function finish() {
    close();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700"
      >
        Сургалт нэмэх
        <PlusIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <p className="text-lg text-ink">Сургалт нэмэх</p>
              <button
                type="button"
                onClick={close}
                aria-label="Хаах"
                className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-500 text-brand-500 hover:bg-brand-50"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {!created ? (
              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink">Бүлэг</label>
                  <div className="mt-1.5 flex gap-2">
                    {!addingNewCourse ? (
                      <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="focus-ring w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                      >
                        <option value="">Сонгоно уу</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Шинэ бүлгийн нэр"
                        className="focus-ring w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAddingNewCourse((v) => !v);
                        setCourseId("");
                        setNewCourseTitle("");
                      }}
                      aria-label={addingNewCourse ? "Байгаа бүлэг сонгох" : "Шинэ бүлэг нэмэх"}
                      className="focus-ring flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-md bg-brand-500 text-white hover:bg-brand-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink">Сургалтын нэр</label>
                  <input
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="Жишээ: Үйлчилгээний стандарт"
                    className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink">Ангилал</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink">Хичээлийн тоо</label>
                    <input
                      value={lessonCount}
                      onChange={(e) => setLessonCount(e.target.value)}
                      placeholder="10"
                      className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">Нийт хугацаа</label>
                    <input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="15 цаг"
                      className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="focus-ring flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="focus-ring flex-1 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {submitting ? "Үүсгэж байна..." : "Нэмэх"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 flex flex-col gap-5">
                <p className="text-sm text-accent">
                  ✓ &quot;{moduleTitle}&quot; амжилттай үүслээ. Одоо видео болон материал
                  хавсаргаж болно.
                </p>

                <div>
                  <label className="block text-sm font-medium text-ink">
                    Видео файл (MP4, MOV — макс 2GB)
                  </label>
                  <div className="mt-1.5">
                    <VideoUploader lessonId={created.lessonId} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink">Зураг оруулах</label>
                  <div className="mt-1.5">
                    <ImageUploader
                      lessonId={created.lessonId}
                      courseId={created.courseId}
                      imageUrl={null}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink">PDF материал</label>
                  <div className="mt-1.5">
                    <PdfMaterialUploader lessonId={created.lessonId} courseId={created.courseId} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={finish}
                  className="focus-ring rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700"
                >
                  Дуусгах
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
