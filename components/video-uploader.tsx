"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VideoUploader({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "requesting" | "uploading" | "processing" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStatus("requesting");

    try {
      // 1. Backend-с Mux Direct Upload URL авах
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) throw new Error("Upload URL авахад алдаа гарлаа");
      const { uploadUrl } = await res.json();

      // 2. Файлыг шууд Mux рүү PUT хийх (сервер дамжуулахгүй)
      setStatus("uploading");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error("Mux upload амжилтгүй"));
        xhr.onerror = () => reject(new Error("Сүлжээний алдаа"));
        xhr.send(file);
      });

      // 3. Mux encode-г webhook дуусгах хүртэл хүлээх — хэрэглэгчид мэдэгдэнэ
      setStatus("processing");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Тодорхойгүй алдаа");
      setStatus("error");
    }
  }

  if (status === "processing") {
    return (
      <p className="text-sm text-brand-500">
        Видео боловсруулж байна... Дуусмагц хуудсыг дахин ачаалахад харагдана.
      </p>
    );
  }

  return (
    <div className="text-sm">
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={status === "requesting" || status === "uploading"}
        className="text-sm"
      />
      {status === "uploading" && (
        <div className="mt-2 h-1.5 w-48 rounded-full bg-ink/10">
          <div
            className="h-1.5 rounded-full bg-brand-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  );
}
