// Видеог Mux руу шууд (Direct Upload) хуулна — файл манай серверээр дамжихгүй.
// Хуулсны дараа Mux encode хийж, webhook (/api/mux/webhook) хичээлд playback_id-г холбоно.
export async function uploadVideoToMux(
  lessonId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  const res = await fetch("/api/mux/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId }),
  });
  if (!res.ok) throw new Error("Upload URL авахад алдаа гарлаа");
  const { uploadUrl } = await res.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) onProgress?.(Math.round((evt.loaded / evt.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Mux upload амжилтгүй"));
    xhr.onerror = () => reject(new Error("Сүлжээний алдаа"));
    xhr.send(file);
  });
}
