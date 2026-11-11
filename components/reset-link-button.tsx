"use client";

import { useState } from "react";

// "Нууц үг сэргээх холбоос" — ажилтан нууц үгээ мартаж, имэйл хүрэхгүй үед
// админ/менежер холбоос үүсгээд хуулж өгнө.
export function ResetLinkButton({
  generate,
}: {
  generate: () => Promise<{ success: true; link: string } | { success: false; error: string }>;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generate();
    setLoading(false);
    if (result.success) setLink(result.link);
    else setError(result.error);
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!link) {
    return (
      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="focus-ring text-sm font-medium text-brand-500 hover:text-brand-700 disabled:opacity-60"
        >
          {loading ? "Үүсгэж байна..." : "Нууц үг сэргээх холбоос үүсгэх"}
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink">Нууц үг сэргээх холбоос</label>
      <div className="mt-1.5 flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="focus-ring w-full min-w-0 rounded-md border border-ink/15 bg-paper px-3 py-2 text-xs text-ink/70"
        />
        <button
          type="button"
          onClick={copy}
          className="focus-ring flex-shrink-0 rounded-md bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-700"
        >
          {copied ? "Хуулсан" : "Хуулах"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink/50">Хугацаатай, нэг удаагийн холбоос. Ажилтанд чатаар илгээнэ үү.</p>
    </div>
  );
}
