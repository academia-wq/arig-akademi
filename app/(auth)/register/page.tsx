"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          И-мэйлээ шалгана уу
        </h1>
        <p className="mt-4 text-ink/60">
          Бүртгэлээ баталгаажуулах холбоосыг {email} хаяг руу илгээлээ.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Link
        prefetch={false}
        href="/"
        className="focus-ring mb-8 flex items-center gap-2 self-start"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-8 w-8" />
        <span className="font-display text-base font-semibold text-ink">
          Ариг Академи
        </span>
      </Link>
      <h1 className="font-display text-2xl font-semibold text-ink">Бүртгүүлэх</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="name">
            Бүтэн нэр
          </label>
          <input
            id="name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            И-мэйл
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-ink"
            htmlFor="password"
          >
            Нууц үг
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-md bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Бүртгэлтэй юу?{" "}
        <Link prefetch={false} href="/login" className="font-medium text-brand-500">
          Нэвтрэх
        </Link>
      </p>
    </main>
  );
}
