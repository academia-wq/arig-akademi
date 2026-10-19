"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadVideoToMux } from "@/lib/mux-upload";

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
      await uploadVideoToMux(lessonId, file, (percent) => {
        setStatus("uploading");
        setProgress(percent);
      });

      // Mux encode-г webhook дуусгах хүртэл хүлээх — хэрэглэгчид мэдэгдэнэ
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
