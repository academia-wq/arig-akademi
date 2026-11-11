"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("email", email);
    const result = await requestPasswordReset(formData);
    setLoading(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  if (sent) {
    return (
      <AuthCard title="Имэйлээ шалгана уу" subtitle="">
        <p className="text-center text-ink/60">
          Хэрэв {email} хаягаар бүртгэл байгаа бол нууц үг сэргээх холбоос илгээгдлээ. Хэдэн минутын дотор
          ирэхгүй бол спам хавтсаа шалгах эсвэл админ, франчайзын менежерээсээ сэргээх холбоос авна уу.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link prefetch={false} href="/login" className="font-semibold text-brand-500">
            Нэвтрэх хуудас руу буцах
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Нууц үг сэргээх" subtitle="Бүртгэлтэй имэйл хаягаа оруулбал шинэ нууц үг тохируулах холбоос илгээнэ.">
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-md bg-brand-500 py-3.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
        </button>
      </form>

      <div className="my-7 h-px w-full bg-ink/10" />
      <p className="text-center text-sm text-ink/50">
        Нууц үгээ санасан уу?{" "}
        <Link prefetch={false} href="/login" className="font-semibold text-brand-500">
          Нэвтрэх
        </Link>
      </p>
    </AuthCard>
  );
}
