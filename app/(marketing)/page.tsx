import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-brand-100 bg-paper px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
            Ариг Академи
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
            Хөгжлөөр үйлчилнэ
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
            Видео хичээл, дадлага, явцын хяналт — бүгд нэг дор. Хаанаас ч,
            хэзээ ч суралц.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
            prefetch={false}
              href="/courses"
              className="focus-ring rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition hover:bg-brand-700"
            >
              Курсууд үзэх
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
      </section>
    </main>
  );
}
