"use client";

import { useState } from "react";
import { uploadLessonMaterial } from "@/app/(app)/admin/actions";

export function PdfMaterialUploader({
  lessonId,
  courseId,
}: {
  lessonId: string;
  courseId: string;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStatus("uploading");

    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadLessonMaterial(lessonId, courseId, formData);
    if (result.success) {
      setUrls((prev) => [...prev, result.url]);
      setStatus("idle");
    } else {
      setError(result.error);
      setStatus("error");
    }
    e.target.value = "";
  }

  return (
    <div className="text-sm">
      {urls.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1">
          {urls.map((url) => (
            <li key={url} className="truncate">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-500 hover:underline"
              >
                {decodeURIComponent(url.split("/").pop() || url)}
              </a>
            </li>
          ))}
        </ul>
      )}
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={status === "uploading"}
        className="text-sm"
      />
      {status === "uploading" && (
        <p className="mt-1 text-brand-500">Байршуулж байна...</p>
      )}
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  );
}
