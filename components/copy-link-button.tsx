"use client";

import { useState } from "react";

// Сайтын хаягтай бүтэн холбоосыг хуулна (жишээ: франчайзын бүртгэлийн холбоос).
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-white px-2 py-1 text-xs text-ink/70">{path}</code>
      <button
        type="button"
        onClick={copy}
        className="focus-ring rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
      >
        {copied ? "Хуулсан" : "Хуулах"}
      </button>
    </div>
  );
}
