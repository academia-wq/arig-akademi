"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CourseDraft } from "@/lib/anthropic/course-draft-schema";
import { SUPPORTED_FILE_ACCEPT } from "@/lib/constants/file-upload";
import {
  generateDraftFromFile,
  saveDraftStructure,
} from "@/app/(admin)/admin/courses/[id]/edit/actions";

export function DocumentCourseBuilder({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [draft, setDraft] = useState<CourseDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    startGenerating(async () => {
      const result = await generateDraftFromFile(courseId, formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDraft(result.draft);
    });

    e.target.value = "";
  }

  function updateModuleTitle(modIndex: number, title: string) {
    if (!draft) return;
    const modules = draft.modules.map((mod, i) =>
      i === modIndex ? { ...mod, title } : mod
    );
    setDraft({ modules });
  }

  function removeModule(modIndex: number) {
    if (!draft) return;
    setDraft({ modules: draft.modules.filter((_, i) => i !== modIndex) });
  }

  function updateLesson(
    modIndex: number,
    lessonIndex: number,
    field: "title" | "content_text",
    value: string
  ) {
    if (!draft) return;
    const modules = draft.modules.map((mod, i) => {
      if (i !== modIndex) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map((lesson, j) =>
          j === lessonIndex ? { ...lesson, [field]: value } : lesson
        ),
      };
    });
    setDraft({ modules });
  }

  function removeLesson(modIndex: number, lessonIndex: number) {
    if (!draft) return;
    const modules = draft.modules.map((mod, i) => {
      if (i !== modIndex) return mod;
      return { ...mod, lessons: mod.lessons.filter((_, j) => j !== lessonIndex) };
    });
    setDraft({ modules });
  }

  function handleSave() {
    if (!draft) return;
    setError(null);
    startSaving(async () => {
      const result = await saveDraftStructure(courseId, draft);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-ink/10 bg-white p-4">
      <h2 className="font-display font-bold text-ink">Файлаас автоматаар үүсгэх</h2>
      <p className="mt-1 text-sm text-ink/60">
        Сургалтын хөтөлбөр эсвэл хичээлийн төлөвлөгөө агуулсан PDF, Word (.docx)
        эсвэл Excel (.xlsx/.xls) файл байршуулбал AI автоматаар бүлэг/хичээлийн
        ноорог гаргаж өгнө. Хадгалахаас өмнө шалгаж засварлах боломжтой.
      </p>

      {!draft && (
        <div className="mt-4">
          <input
            type="file"
            accept={SUPPORTED_FILE_ACCEPT}
            onChange={handleFileChange}
            disabled={isGenerating}
            className="text-sm"
          />
          {isGenerating && (
            <p className="mt-2 text-sm text-brand-500">
              Файлыг боловсруулж байна... (хэдэн секунд болж болно)
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {draft && (
        <div className="mt-4 space-y-4">
          {draft.modules.map((mod, modIndex) => (
            <div key={modIndex} className="rounded-md border border-ink/10 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={mod.title}
                  onChange={(e) => updateModuleTitle(modIndex, e.target.value)}
                  className="focus-ring flex-1 rounded-md border border-ink/15 px-2 py-1 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => removeModule(modIndex)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Устгах
                </button>
              </div>

              <ul className="mt-3 space-y-2">
                {mod.lessons.map((lesson, lessonIndex) => (
                  <li key={lessonIndex} className="rounded-md bg-ink/5 p-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(modIndex, lessonIndex, "title", e.target.value)
                        }
                        className="focus-ring flex-1 rounded-md border border-ink/15 bg-white px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeLesson(modIndex, lessonIndex)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Устгах
                      </button>
                    </div>
                    <textarea
                      value={lesson.content_text}
                      onChange={(e) =>
                        updateLesson(modIndex, lessonIndex, "content_text", e.target.value)
                      }
                      rows={2}
                      className="focus-ring mt-2 w-full rounded-md border border-ink/15 bg-white px-2 py-1 text-sm"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || draft.modules.length === 0}
              className="focus-ring rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSaving ? "Хадгалж байна..." : "Бүтцийг хадгалах"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={isSaving}
              className="focus-ring rounded-md border border-ink/15 px-4 py-2 text-sm font-medium hover:border-ink/30"
            >
              Цуцлах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
