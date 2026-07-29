"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Нэвтрэх</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
          {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
        <div className="h-px flex-1 bg-ink/10" />
        эсвэл
        <div className="h-px flex-1 bg-ink/10" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className="focus-ring w-full rounded-md border border-ink/15 px-4 py-2.5 font-medium text-ink transition hover:border-ink/30"
      >
        Google-ээр нэвтрэх
      </button>

      <p className="mt-6 text-center text-sm text-ink/60">
        Бүртгэлгүй юу?{" "}
        <Link prefetch={false} href="/register" className="font-medium text-brand-500">
          Бүртгүүлэх
        </Link>
      </p>
    </main>
  );
}
