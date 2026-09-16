"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth-card";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/learn";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("И-мэйл эсвэл нууц үг буруу байна.");
      return;
    }

    // router.push нэг л удаа target route-г серверээс дуудна; үүнтэй зэрэг
    // router.refresh()-г дуудвал ижил route руу 2 дахь давхар server
    // request зэрэг явж, хоёулаа Supabase session-г зэрэг рефреш хийхийг
    // оролдоод "Invalid Refresh Token: Already Used" алдаа өгдөг байсан.
    router.push(redirectTo);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirectTo}`,
      },
    });
  }

  return (
    <AuthCard
      title="Нэвтрэх"
      subtitle="Ариг академийн цахим сургалтын платформд тавтай морил"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full rounded-md bg-brand-500 py-3.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
        </div>
      </form>

      <div className="my-7 h-px w-full bg-ink/10" />

      <button
        onClick={handleGoogleLogin}
        className="focus-ring w-full rounded-md border border-ink/15 py-3 text-sm font-medium text-ink transition hover:border-ink/30"
      >
        Google-ээр нэвтрэх
      </button>

      <p className="mt-6 text-center text-sm text-ink/50">
        Бүртгэлгүй юу?{" "}
        <Link prefetch={false} href="/register" className="font-semibold text-brand-500">
          Бүртгүүлэх
        </Link>
      </p>
    </AuthCard>
  );
}
