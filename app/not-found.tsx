import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export const metadata = { title: "Хуудас олдсонгүй — Ариг Академи" };

export default function NotFound() {
  return (
    <AuthCard title="Хуудас олдсонгүй" subtitle="404">
      <p className="text-ink/60">
        Таны хайсан хуудас байхгүй, эсвэл зөөгдсөн байна. Холбоосоо шалгаад дахин оролдоно уу.
      </p>
      <Link
        prefetch={false}
        href="/"
        className="focus-ring mt-8 flex h-12 w-full items-center justify-center rounded-md bg-brand-500 font-medium text-white hover:bg-brand-700"
      >
        Нүүр хуудас руу буцах
      </Link>
    </AuthCard>
  );
}
