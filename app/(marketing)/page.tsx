import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-brand-100 bg-paper px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div className="text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
              Ариг Академи
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
              Хөгжлөөр үйлчилнэ
            </h1>
            <div className="mt-10 flex justify-center gap-4 md:justify-start">
              <Link
            prefetch={false}
                href="/learn"
                className="focus-ring rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
              >
                Сургалт эхлэх
              </Link>
              <Link
            prefetch={false}
                href="/register"
                className="focus-ring rounded-md border border-ink/15 px-6 py-3 font-medium text-ink transition hover:border-ink/30"
              >
                Бүртгүүлэх
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl shadow-lg md:max-w-none">
            <Image
              src="/hero-illustration.png"
              alt="Ариг Аня"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
