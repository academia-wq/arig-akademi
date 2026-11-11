"use client";

import { useEffect } from "react";
import Link from "next/link";

// Хуудас дотор баригдаагүй алдаа гарвал Next.js-ийн англи хуудасны оронд үүнийг харуулна.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-[460px] rounded-2xl bg-white p-8 shadow-[0px_8px_12px_rgba(72,83,83,0.07)] sm:p-12">
        <h1 className="font-display text-[28px] leading-9 text-ink">Алдаа гарлаа</h1>
        <p className="mt-4 text-ink/60">
          Уучлаарай, хуудсыг ачаалах үед алдаа гарлаа. Дахин оролдоно уу. Асуудал давтагдвал админд хандана уу.
        </p>
        {error.digest && <p className="mt-3 text-xs text-ink/40">Алдааны код: {error.digest}</p>}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="focus-ring flex h-12 flex-1 items-center justify-center rounded-md bg-brand-500 font-medium text-white hover:bg-brand-700"
          >
            Дахин оролдох
          </button>
          <Link
            prefetch={false}
            href="/"
            className="focus-ring flex h-12 flex-1 items-center justify-center rounded-md border border-ink/20 font-medium text-ink hover:bg-ink/5"
          >
            Нүүр хуудас
          </Link>
        </div>
      </div>
    </div>
  );
}
