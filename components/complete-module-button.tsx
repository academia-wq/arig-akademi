"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeModule } from "@/app/(app)/learn/actions";
import { LessonCelebration } from "@/components/lesson-celebration";

export function CompleteModuleButton({
  moduleId,
  courseSlug,
  initiallyCompleted,
  courseDone,
  courseTotal,
  nextHref,
}: {
  moduleId: string;
  courseSlug: string;
  initiallyCompleted: boolean;
  // Модуль дууссаны дараах сургалтын явц (баярын цонхонд харуулна).
  courseDone: number;
  courseTotal: number;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  async function handleClick() {
    setSaving(true);
    setError(null);
    const result = await completeModule(moduleId, courseSlug);
    setSaving(false);
    // Хуудсыг баярын цонх хаагдсаны дараа шинэчилнэ — эс тэгвээс энэ хэсгийн бүтэц
    // солигдож, цонх дахин үүсээд анимейшн 2 удаа тоглодог.
    if (result.success) setCelebrating(true);
    else setError(result.error);
  }

  return (
    <div className="mt-2">
      {initiallyCompleted ? (
        <p className="text-center text-sm font-medium text-accent">✓ Модуль дууссан</p>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClick}
            disabled={saving || celebrating}
            className="focus-ring w-full rounded-md bg-brand-500 px-6 py-3 text-sm font-medium leading-[18px] text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Хадгалж байна..." : "Модулийг дуусгах"}
          </button>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </>
      )}
      {celebrating && (
        <LessonCelebration
          title="Модуль дууслаа!"
          done={courseDone}
          total={courseTotal}
          nextHref={nextHref}
          nextLabel="Дараагийн модуль"
          onClose={() => {
            setCelebrating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
