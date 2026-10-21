"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth-card";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}

// Админы үүсгэсэн ажилтан урилгын холбоосоор орж нууц үгээ тохируулна.
// Токеныг хуудас нээгдэхэд биш, товч дарахад баталгаажуулна — имэйлийн
// сканнерууд холбоосыг урьдчилан нээвэл токен шатахаас сэргийлнэ.
function SetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type: EmailOtpType = rawType === "magiclink" ? "magiclink" : "invite";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Нууц үг дор хаяж 6 тэмдэгт байна.");
      return;
    }
    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна.");
      return;
    }

    setLoading(true);
    if (tokenHash) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (verifyError) {
        setLoading(false);
        setError("Холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Админаас шинэ холбоос авна уу.");
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    window.location.href = "/learn";
  }

  if (!tokenHash) {
    return (
      <AuthCard title="Нууц үг тохируулах" subtitle="">
        <p className="text-center text-ink/60">
          Холбоос дутуу байна. Админаас ирсэн холбоосоор бүтнээр нь орно уу.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link prefetch={false} href="/login" className="font-semibold text-brand-500">
            Нэвтрэх
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Нууц үг тохируулах"
      subtitle="Ариг академид тавтай морил! Нэвтрэхдээ ашиглах нууц үгээ үүсгэнэ үү."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-ink" htmlFor="password">
            Шинэ нууц үг
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Дор хаяж 6 тэмдэгт"
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
              {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-ink" htmlFor="confirm">
            Нууц үг давтах
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Нууц үгээ дахин оруулна уу"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/20 px-4 text-ink placeholder:text-ink/40"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-md bg-brand-500 py-3.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Хадгалж байна..." : "Нууц үг хадгалах"}
        </button>
      </form>
    </AuthCard>
  );
}
