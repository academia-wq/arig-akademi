"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { LessonCelebration } from "@/components/lesson-celebration";
import { PlayIcon } from "@/components/icons";

const COMPLETION_THRESHOLD = 0.9; // 90%+ үзвэл дууссанд тооцно (спек 4.3.4)
const SAVE_INTERVAL_MS = 10_000; // 10 секунд тутамд хадгална (спек 4.3.3)

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
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [celebrating, setCelebrating] = useState(false);
  const [started, setStarted] = useState(false);
  const lastSavedAt = useRef(0);
  const hasMarkedComplete = useRef(initiallyCompleted);

  // Хичээл анх удаа дуусахад нэг л удаа дуудагдана.
  function markCompleteOnce(positionSeconds: number) {
    if (hasMarkedComplete.current) return false;
    hasMarkedComplete.current = true;
    setCompleted(true);
    setCelebrating(true);
    // Хуудсыг (явцын дугуй г.м.) баярын цонх хаагдсаны дараа шинэчилнэ.
    saveProgress(positionSeconds, true);
    return true;
  }

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

  function handleTimeUpdate(e: Event) {
    const media = e.currentTarget as HTMLMediaElement;
    const now = Date.now();

    if (now - lastSavedAt.current < SAVE_INTERVAL_MS) return;
    lastSavedAt.current = now;

    const ratio = media.duration > 0 ? media.currentTime / media.duration : 0;
    if (ratio >= COMPLETION_THRESHOLD && markCompleteOnce(media.currentTime)) return;

    saveProgress(media.currentTime, hasMarkedComplete.current);
  }

  function handleMarkComplete() {
    markCompleteOnce(0);
  }

  return (
    <div>
      <div className="relative aspect-[724/400] w-full overflow-hidden rounded-2xl bg-ink">
        {started ? (
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            startTime={startTime}
            autoPlay
            metadata={{ video_id: lessonId }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              if (!markCompleteOnce(0)) saveProgress(0, true);
            }}
            style={{ width: "100%", height: "100%", "--media-object-fit": "cover" } as React.CSSProperties}
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
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-ink/50">
          {completed ? "Энэ хичээлийг дуусгасан" : "Явц хадгалагдаж байна..."}
        </span>
        {!completed && (
          <button
            onClick={handleMarkComplete}
            className="focus-ring text-sm font-medium text-brand-500"
          >
            Дууссан гэж тэмдэглэх
          </button>
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
