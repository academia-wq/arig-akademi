"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAvatar } from "@/app/(app)/settings/actions";

export function AvatarUploader({
  avatarUrl,
  initials,
}: {
  avatarUrl: string | null;
  initials: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStatus("uploading");

    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadAvatar(formData);
    if (result.success) {
      setPreview(result.avatarUrl);
      setStatus("idle");
      router.refresh();
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-shrink-0 flex-col items-center gap-3">
      <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-50 font-display text-3xl font-semibold text-brand-700">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <label className="focus-ring cursor-pointer text-xs font-medium text-brand-500 hover:text-brand-700">
        {status === "uploading" ? "Байршуулж байна..." : "Зураг солих"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={status === "uploading"}
          className="hidden"
        />
      </label>
      {error && <p className="max-w-[140px] text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
