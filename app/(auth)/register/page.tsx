"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth-card";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <AuthCard title="И-мэйлээ шалгана уу" subtitle="">
        <p className="text-center text-ink/60">
          Бүртгэлээ баталгаажуулах холбоосыг {email} хаяг руу илгээлээ.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Бүртгүүлэх"
      subtitle="Ариг академийн цахим сургалтын платформд тавтай морил"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-ink" htmlFor="name">
            Овог нэр
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Овог нэр"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/20 px-4 text-ink placeholder:text-ink/40"
          />
        </div>
        <div>
          <label className="block text-sm text-ink" htmlFor="email">
            Имэйл хаяг
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="Имэйл хаягаа оруулна уу"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/20 px-4 text-ink placeholder:text-ink/40"
          />
        </div>
        <div>
          <label className="block text-sm text-ink" htmlFor="password">
            Нууц үг
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Нууц үгээ оруулна уу"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring h-12 w-full rounded-md border border-ink/20 px-4 pr-11 text-ink placeholder:text-ink/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
              className="focus-ring absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-md bg-brand-500 py-3.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
        </button>
      </form>

      <div className="my-7 h-px w-full bg-ink/10" />

      <p className="text-center text-sm text-ink/50">
        Бүртгэлтэй юу?{" "}
        <Link prefetch={false} href="/login" className="font-semibold text-brand-500">
          Нэвтрэх
        </Link>
      </p>
    </AuthCard>
  );
}
