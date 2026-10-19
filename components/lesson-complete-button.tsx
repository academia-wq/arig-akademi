"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LessonCelebration } from "@/components/lesson-celebration";

// Видеогүй (зураг/текст) хичээлийг ажилтан өөрөө "дууссан" болгоно.
// Видеотой хичээл LessonPlayer-ээр бодит үзсэн хугацаагаар дуусдаг.
export function LessonCompleteButton({
  lessonId,
  initiallyCompleted,
  courseDone,
  courseTotal,
  nextHref,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
  courseDone: number;
  courseTotal: number;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  async function handleClick() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, lastPositionSeconds: 0, isCompleted: true }),
      });
      if (!res.ok) throw new Error();
      setCompleted(true);
      setCelebrating(true);
    } catch {
      setError("Хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-4 text-sm">
      {completed ? (
        <span className="text-accent">✓ Энэ хичээлийг дуусгасан</span>
      ) : (
        <>
          <span className={error ? "text-red-600" : "text-ink/50"}>
            {error || "Хичээлээ уншиж дуусаад тэмдэглэнэ үү."}
          </span>
          <button
            type="button"
            onClick={handleClick}
            disabled={saving}
            className="focus-ring flex-shrink-0 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Хадгалж байна..." : "Дууссан гэж тэмдэглэх"}
          </button>
        </>
      )}

      {celebrating && (
        <LessonCelebration
          done={courseDone}
          total={courseTotal}
          nextHref={nextHref}
          onClose={() => {
            setCelebrating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
