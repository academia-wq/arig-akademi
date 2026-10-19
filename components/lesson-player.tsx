"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import MuxPlayer from "@mux/mux-player-react";
import { LessonCelebration } from "@/components/lesson-celebration";
import { PlayIcon, ChevronDownIcon } from "@/components/icons";

const COMPLETION_THRESHOLD = 0.9; // Видеоны 90%-ийг БОДИТООР үзвэл дууссанд тооцно (спек 4.3.4)
const SAVE_INTERVAL_MS = 10_000; // 10 секунд тутамд хадгална (спек 4.3.3)
// Энгийн тоглолтын үед timeupdate хооронд ~0.25с (2x үед ~0.5с); үүнээс их үсрэлт = гүйлгэсэн.
const MAX_PLAYBACK_STEP = 1.5;
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

// Үзсэн секундүүдийг энэ хөтчид хадгална — хуудсыг дахин ачаалсан ч тооцоо үргэлжилнэ.
function storageKey(lessonId: string) {
  return `arig:watched:${lessonId}`;
}
function loadWatched(lessonId: string): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(lessonId));
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}
function storeWatched(lessonId: string, seconds: Set<number>) {
  try {
    localStorage.setItem(storageKey(lessonId), JSON.stringify(Array.from(seconds)));
  } catch {
    // хадгалах боломжгүй (private mode г.м.) — тухайн сессийн дотор тоолсоор байна
  }
}

export function LessonPlayer({
  lessonId,
  playbackId,
  startTime,
  initiallyCompleted,
  courseDone,
  courseTotal,
  nextHref,
}: {
  lessonId: string;
  playbackId: string;
  startTime: number;
  initiallyCompleted: boolean;
  // Энэ хичээл дууссаны дараах сургалтын явц (баярын цонхонд харуулна).
  courseDone: number;
  courseTotal: number;
  nextHref: string | null;
}) {
  const router = useRouter();
  const playerRef = useRef<HTMLMediaElement | null>(null);
  const [completed, setCompleted] = useState(initiallyCompleted);
  // Энэ удаа үзэж байхад дууссан эсэх — баярын цонхыг видео төгсөхөд л харуулна.
  const [justCompleted, setJustCompleted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [started, setStarted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rateOpen, setRateOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const rateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rateOpen) return;
    function onDown(e: MouseEvent) {
      if (rateMenuRef.current && !rateMenuRef.current.contains(e.target as Node)) setRateOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setRateOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [rateOpen]);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const lastSavedAt = useRef(0);
  const hasMarkedComplete = useRef(initiallyCompleted);
  const watchedSeconds = useRef<Set<number>>(new Set());
  const lastTime = useRef(startTime);

  useEffect(() => {
    watchedSeconds.current = loadWatched(lessonId);
  }, [lessonId]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.playbackRate = rate;
  }, [rate, started]);

  const saveProgress = useCallback(
    async (positionSeconds: number, isCompleted: boolean) => {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            lastPositionSeconds: Math.floor(positionSeconds),
            isCompleted,
          }),
        });
      } catch {
        // Сүлжээний алдааг чимээгүй тэвчинэ — дараагийн timeupdate дээр дахин оролдоно
      }
    },
    [lessonId]
  );

  // 90% бодитоор үзмэгц нэг л удаа: хадгалж, жижиг мэдэгдэл харуулна (үзэлтийг тасалдуулахгүй).
  function markCompleteOnce(positionSeconds: number) {
    if (hasMarkedComplete.current) return;
    hasMarkedComplete.current = true;
    setCompleted(true);
    setJustCompleted(true);
    saveProgress(positionSeconds, true);
  }

  function updateWatched(media: HTMLMediaElement) {
    const ratio =
      media.duration > 0
        ? Math.min(1, watchedSeconds.current.size / Math.floor(media.duration))
        : 0;
    setWatchedPercent(Math.round(ratio * 100));
    if (ratio >= COMPLETION_THRESHOLD) markCompleteOnce(media.currentTime);
  }

  function handleTimeUpdate(e: Event) {
    const media = e.currentTarget as HTMLMediaElement;
    const time = media.currentTime;
    const step = time - lastTime.current;

    // Зөвхөн энгийн тоглолтоор өнгөрсөн секундүүдийг тоолно — гүйлгэж алгассан хэсэг орохгүй.
    if (step > 0 && step <= MAX_PLAYBACK_STEP) {
      const before = watchedSeconds.current.size;
      for (let s = Math.floor(lastTime.current); s < Math.floor(time); s++) watchedSeconds.current.add(s);
      if (watchedSeconds.current.size !== before) storeWatched(lessonId, watchedSeconds.current);
    }
    lastTime.current = time;
    updateWatched(media);

    const now = Date.now();
    if (now - lastSavedAt.current < SAVE_INTERVAL_MS) return;
    lastSavedAt.current = now;
    saveProgress(time, hasMarkedComplete.current);
  }

  function handleEnded(e: Event) {
    const media = e.currentTarget as HTMLMediaElement;
    // Төгсгөлд энгийн тоглолтоор хүрсэн бол сүүлийн секундүүдийг тоолно.
    if (media.currentTime - lastTime.current <= MAX_PLAYBACK_STEP) {
      for (let s = Math.floor(lastTime.current); s < Math.ceil(media.duration); s++) watchedSeconds.current.add(s);
      storeWatched(lessonId, watchedSeconds.current);
    }
    updateWatched(media);
    saveProgress(0, hasMarkedComplete.current);
    // Баярын цонх: энэ удаа дуусгасан бол видео бүрэн төгсөхөд л гарна.
    if (hasMarkedComplete.current && !initiallyCompleted) setCelebrating(true);
  }

  return (
    <div>
      {/* isolate + translateZ: тоглож буй видеог Chrome-д бөөрөнхий булангаар заавал тайруулна. */}
      <div className="group/video relative isolate aspect-[724/400] w-full overflow-hidden rounded-2xl bg-ink [transform:translateZ(0)]">
        {started && (
          // Хурдны товч видеоны баруун дээд буланд: хулгана видеон дээр, зогссон эсвэл цэс нээлттэй үед харагдана.
          <div
            ref={rateMenuRef}
            className={clsx(
              "absolute right-3 top-3 z-10 transition-opacity duration-200 group-hover/video:opacity-100",
              paused || rateOpen ? "opacity-100" : "opacity-0 focus-within:opacity-100"
            )}
          >
            <button
              type="button"
              onClick={() => setRateOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={rateOpen}
              aria-label="Тоглуулах хурд"
              className="focus-ring flex items-center gap-1 rounded-md bg-black/55 px-2.5 py-1 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              {rate}x
              <ChevronDownIcon className={clsx("h-3.5 w-3.5 transition", rateOpen && "rotate-180")} />
            </button>
            {rateOpen && (
              <ul
                role="listbox"
                aria-label="Тоглуулах хурд"
                className="absolute right-0 top-[calc(100%+6px)] min-w-[76px] overflow-hidden rounded-md bg-black/70 py-1 text-sm text-white backdrop-blur-sm"
              >
                {PLAYBACK_RATES.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={rate === r}
                      onClick={() => {
                        setRate(r);
                        setRateOpen(false);
                      }}
                      className={clsx(
                        "w-full px-3 py-1.5 text-left transition hover:bg-white/15",
                        rate === r && "font-semibold text-brand-300"
                      )}
                    >
                      {r}x
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {started ? (
          <MuxPlayer
            ref={(el) => {
              playerRef.current = el as unknown as HTMLMediaElement | null;
            }}
            playbackId={playbackId}
            streamType="on-demand"
            startTime={startTime}
            autoPlay
            metadata={{ video_id: lessonId }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={(e) => {
              (e.currentTarget as HTMLMediaElement).playbackRate = rate;
            }}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            style={
              {
                width: "100%",
                height: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                "--media-object-fit": "cover",
                // Mux-ийн хурдны цэс FigmaScale-ийн zoom дор буруу байрлалд гарч тайрагддаг тул
                // нуугаад видеоны баруун дээд буланд өөрсдийн товчоор сольсон.
                "--playback-rate-button": "none",
              } as React.CSSProperties
            }
          />
        ) : (
          // Дизайн шиг: эхлэхээс өмнө видеоны зураг + голд цагаан тоглуулах товч.
          <button
            type="button"
            onClick={() => setStarted(true)}
            aria-label="Видео тоглуулах"
            className="focus-ring group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://image.mux.com/${playbackId}/thumbnail.webp?width=1280${startTime > 0 ? `&time=${Math.floor(startTime)}` : ""}`}
              alt=""
              className="h-full w-full object-cover"
            />
            <span aria-hidden className="absolute inset-0 bg-black/30" />
            <span className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.19)] transition group-hover:scale-110">
              <PlayIcon className="ml-1 h-7 w-7 text-brand-500" />
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 text-sm">
        {completed ? (
          <span className="text-accent">
            ✓ {justCompleted ? "Хичээл дууслаа! Бичлэгийг үргэлжлүүлэн үзэж болно." : "Энэ хичээлийг дуусгасан"}
          </span>
        ) : (
          <span className="text-ink/50">
            Видеоны 90%-ийг үзэхэд хичээл дуусна ·{" "}
            <span className="font-medium text-brand-500">Үзсэн: {watchedPercent}%</span>
          </span>
        )}
      </div>

      {celebrating && (
        <LessonCelebration
          done={courseDone}
          total={courseTotal}
          nextHref={nextHref}
          onClose={() => {
            setCelebrating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
