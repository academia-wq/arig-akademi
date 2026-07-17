"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadLessonImage } from "@/app/(admin)/admin/courses/[id]/edit/actions";

export function ImageUploader({
  lessonId,
  courseId,
  imageUrl,
}: {
  lessonId: string;
  courseId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStatus("uploading");

    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadLessonImage(lessonId, courseId, formData);
    if (result.success) {
      setStatus("idle");
      router.refresh();
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  return (
    <div className="text-sm">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="mb-2 h-24 w-auto rounded-md border border-ink/10 object-cover"
        />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={status === "uploading"}
        className="text-sm"
      />
      {status === "uploading" && (
        <p className="mt-1 text-brand-500">Зураг байршуулж байна...</p>
      )}
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  );
}
