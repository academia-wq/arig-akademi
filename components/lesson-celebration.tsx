"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// Duolingo маягийн "Сайн байна!" баярын цонх — хичээл/модуль дуусахад гарна.
// Нэмэлт сан ашиглаагүй: confetti, үсрэлт нь CSS keyframe (app/globals.css), дуу нь Web Audio.

const PRAISES = ["Сайн байна!", "Гайхалтай!", "Маш сайн!", "Шилдэг!", "Ийм л байх ёстой!"];
const CHEERS = [
  "Та дахиад нэг алхам урагшиллаа.",
  "Ингээд л тасралтгүй үргэлжлүүлээрэй.",
  "Мэдлэг тань өдөр бүр нэмэгдэж байна.",
  "Таны хичээл зүтгэл үр дүнгээ өгч байна.",
];
const CONFETTI_COLORS = ["#FF7F56", "#FFAD8C", "#2E6E5E", "#FFD166", "#485353", "#FFDDD0"];

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

// Богино "дин-дин-дин" баярын дуу (C6 → E6 → G6). Хөтөч дуу хаасан бол чимээгүй өнгөрнө.
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [1046.5, 1318.5, 1568].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // дуу заавал биш
  }
}

export function LessonCelebration({
  title,
  done,
  total,
  nextHref,
  nextLabel = "Дараагийн хичээл",
  onClose,
}: {
  title?: string;
  done: number;
  total: number;
  nextHref?: string | null;
  nextLabel?: string;
  onClose: () => void;
}) {
  const [praise] = useState(() => title ?? pick(PRAISES));
  const [cheer] = useState(() => pick(CHEERS));
  const prevPercent = total > 0 ? Math.round((Math.max(done - 1, 0) / total) * 100) : 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const [barPercent, setBarPercent] = useState(prevPercent);
  const primaryRef = useRef<HTMLElement>(null);

  const confetti = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 240,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        round: Math.random() > 0.7,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Нээгдэх үед нэг л удаа: дуу, focus, явцын мөрийг өсгөх.
  useEffect(() => {
    playChime();
    primaryRef.current?.focus();
    const t = setTimeout(() => setBarPercent(percent), 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return createPortal(
    <div
      className="celebrate-motion fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overflow-x-hidden bg-ink/50 p-4 py-10"
      style={{ animation: "celebrate-backdrop 200ms ease-out both" }}
      onClick={onClose}
    >
      {/* Confetti */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti-piece absolute top-0 block"
            style={
              {
                left: `${c.left}%`,
                width: c.w,
                height: c.round ? c.w : c.h,
                borderRadius: c.round ? "9999px" : "2px",
                background: c.color,
                "--drift": `${c.drift}px`,
                "--spin": `${c.spin}deg`,
                animation: `confetti-fall ${c.duration}s cubic-bezier(.2,.6,.4,1) ${c.delay}s both`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebrate-title"
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-sm rounded-3xl bg-white px-6 pb-6 pt-10 text-center shadow-2xl"
        style={{ animation: "celebrate-card 520ms cubic-bezier(.2,.9,.3,1.2) both" }}
      >
        {/* Тэмдэг: эргэлддэг туяа + үсэрч гарах дугуй + зурагдах чагт */}
        <div className="relative mx-auto h-32 w-32">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-full opacity-60"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, #FFDDD0 0deg 12deg, transparent 12deg 30deg)",
              maskImage: "radial-gradient(circle, black 35%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle, black 35%, transparent 70%)",
              animation: "celebrate-rays 9s linear infinite",
            }}
          />
          {[
            "left-0 top-2",
            "right-0 top-0",
            "-left-3 bottom-4",
            "-right-2 bottom-2",
          ].map((pos, i) => (
            <span
              key={pos}
              aria-hidden
              className={`absolute ${pos} text-xl text-[#FFD166]`}
              style={{ animation: `celebrate-sparkle 1.6s ease-in-out ${0.4 + i * 0.3}s infinite` }}
            >
              ✦
            </span>
          ))}
          <div
            className="relative flex h-32 w-32 items-center justify-center"
            style={{ animation: "celebrate-hop 1.4s ease-in-out 1s infinite" }}
          >
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-500 shadow-[0_8px_0_#E35F37]"
              style={{ animation: "celebrate-badge 650ms cubic-bezier(.2,.9,.3,1.3) 150ms both" }}
            >
              <svg viewBox="0 0 52 52" className="h-16 w-16" fill="none">
                <path
                  d="M14 27 L23 36 L39 18"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="40"
                  strokeDashoffset="40"
                  style={{ animation: "celebrate-check 400ms ease-out 650ms forwards" }}
                />
              </svg>
            </div>
          </div>
        </div>

        <h2
          id="celebrate-title"
          className="mt-6 font-display text-3xl font-bold text-brand-500"
          style={{ animation: "celebrate-text 500ms cubic-bezier(.2,.9,.3,1.3) 450ms both" }}
        >
          {praise}
        </h2>
        <p
          className="mt-2 text-sm text-ink/70"
          style={{ animation: "celebrate-rise 400ms ease-out 650ms both" }}
        >
          {cheer}
        </p>

        {total > 0 && (
          <div className="mt-6" style={{ animation: "celebrate-rise 400ms ease-out 750ms both" }}>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-ink/60">Сургалтын явц</span>
              <span className="text-brand-500">
                {done}/{total} хичээл
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-700 ease-out"
                style={{ width: `${barPercent}%` }}
              />
            </div>
          </div>
        )}

        <div
          className="mt-7 flex flex-col gap-2"
          style={{ animation: "celebrate-rise 400ms ease-out 850ms both" }}
        >
          {nextHref ? (
            <Link
              ref={primaryRef as React.Ref<HTMLAnchorElement>}
              prefetch={false}
              href={nextHref}
              onClick={onClose}
              className="focus-ring rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_4px_0_#E35F37] transition active:translate-y-1 active:shadow-none hover:bg-brand-700"
            >
              {nextLabel}
            </Link>
          ) : null}
          <button
            ref={nextHref ? undefined : (primaryRef as React.Ref<HTMLButtonElement>)}
            type="button"
            onClick={onClose}
            className={
              nextHref
                ? "focus-ring rounded-xl px-4 py-2.5 text-sm font-medium text-ink/60 transition hover:bg-ink/5 hover:text-ink"
                : "focus-ring rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_4px_0_#E35F37] transition active:translate-y-1 active:shadow-none hover:bg-brand-700"
            }
          >
            {nextHref ? "Энд үлдэх" : "Үргэлжлүүлэх"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
