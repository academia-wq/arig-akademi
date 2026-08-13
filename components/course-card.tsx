import Link from "next/link";
import { ArrowRightIcon, BookIcon, ClockIcon } from "@/components/icons";
import { formatDuration } from "@/lib/format";

const FALLBACK_TINTS = ["bg-brand-50", "bg-accent/10", "bg-brand-100"];

export function CourseCard({
  slug,
  title,
  thumbnailUrl,
  durationSeconds,
  progress,
  tintIndex = 0,
  href,
  eyebrow,
  ctaLabel,
}: {
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  progress: number;
  tintIndex?: number;
  href?: string;
  eyebrow?: string;
  ctaLabel?: string;
}) {
  const duration = formatDuration(durationSeconds);
  const started = progress > 0;
  const done = progress >= 100;

  return (
    <Link
      prefetch={false}
      href={href ?? `/learn/${slug}`}
      className="focus-ring group flex flex-col overflow-hidden rounded-lg border border-ink/10 bg-white transition hover:border-brand-300 hover:shadow-sm"
    >
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden ${
          thumbnailUrl ? "bg-ink/5" : FALLBACK_TINTS[tintIndex % FALLBACK_TINTS.length]
        }`}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookIcon className="h-10 w-10 text-brand-500/40" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
          {eyebrow ?? (done ? "Дууссан" : started ? "Үргэлжилж буй" : "Курс")}
        </p>
        <h3 className="mt-1.5 font-display font-bold leading-snug text-ink">
          {title}
        </h3>

        {duration && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/50">
            <ClockIcon className="h-4 w-4" />
            {duration}
          </p>
        )}

        {started && (
          <div className="mt-3 h-1.5 rounded-full bg-ink/5">
            <div
              className="h-1.5 rounded-full bg-accent"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}

        <p className="focus-ring mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-brand-500">
          {ctaLabel ?? (done ? "Дахин үзэх" : started ? "Үргэлжлүүлэх" : "Эхлэх")}
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}
