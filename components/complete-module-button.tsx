"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeModule } from "@/app/(app)/learn/actions";

export function CompleteModuleButton({
  moduleId,
  courseSlug,
  initiallyCompleted,
}: {
  moduleId: string;
  courseSlug: string;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (initiallyCompleted) {
    return <p className="mt-4 text-center text-sm font-medium text-accent">✓ Модуль дууссан</p>;
  }

  async function handleClick() {
    setSaving(true);
    setError(null);
    const result = await completeModule(moduleId, courseSlug);
    setSaving(false);
    if (result.success) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        className="focus-ring w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Хадгалж байна..." : "Модулийг дуусгах"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
