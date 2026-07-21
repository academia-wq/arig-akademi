"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkCompleteButton({
  lessonId,
  initiallyCompleted,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, lastPositionSeconds: 0, isCompleted: true }),
      });
      setCompleted(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      {completed ? (
        <span className="text-sm font-medium text-accent">✓ Энэ хичээлийг дуусгасан</span>
      ) : (
        <button
          onClick={handleClick}
          disabled={saving}
          className="focus-ring rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Хадгалж байна..." : "Дуусгах"}
        </button>
      )}
    </div>
  );
}
