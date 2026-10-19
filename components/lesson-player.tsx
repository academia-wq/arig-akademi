"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { LessonCelebration } from "@/components/lesson-celebration";
import { PlayIcon } from "@/components/icons";

const COMPLETION_THRESHOLD = 0.9; // Видеоны 90%-ийг БОДИТООР үзвэл дууссанд тооцно (спек 4.3.4)
const SAVE_INTERVAL_MS = 10_000; // 10 секунд тутамд хадгална (спек 4.3.3)
// Энгийн тоглолтын үед timeupdate хооронд ~0.25с; үүнээс их үсрэлт = гүйлгэсэн (seek).
const MAX_PLAYBACK_STEP = 1.5;
// Урагш гүйлгэхэд хамгийн хол үзсэн цэгээс ийм хэмжээгээр л давахыг зөвшөөрнө.
const SEEK_TOLERANCE = 2;

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
  // Бодитоор тоглогдсон секундүүд (гүйлгэж алгассан хэсэг орохгүй). Урагш гүйлгэх хориотой тул
  // өмнө нь хадгалсан байрлал хүртэлх хэсгийг үзсэнд тооцно.
  const watchedSeconds = useRef(new Set<number>(Array.from({ length: Math.floor(startTime) }, (_, i) => i)));
  const lastTime = useRef(startTime);
  const maxReached = useRef(startTime);
  const [watchedPercent, setWatchedPercent] = useState(0);

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

  function watchedRatio(duration: number) {
    return duration > 0 ? Math.min(1, watchedSeconds.current.size / Math.floor(duration)) : 0;
  }

  function handleTimeUpdate(e: Event) {
    const media = e.currentTarget as HTMLMediaElement;
    const time = media.currentTime;
    const step = time - lastTime.current;

    if (!hasMarkedComplete.current && time > maxReached.current + SEEK_TOLERANCE) {
      // Урагш гүйлгэсэн — хамгийн хол үзсэн цэг рүү буцаана (дууссан хичээлд хязгааргүй).
      media.currentTime = maxReached.current;
      lastTime.current = maxReached.current;
      return;
    }

    if (step > 0 && step <= MAX_PLAYBACK_STEP) {
      // Энгийн тоглолт: энэ хооронд тоглогдсон секундүүдийг тэмдэглэнэ.
      for (let s = Math.floor(lastTime.current); s < Math.floor(time); s++) watchedSeconds.current.add(s);
      maxReached.current = Math.max(maxReached.current, time);
    }
    lastTime.current = time;

    const ratio = watchedRatio(media.duration);
    setWatchedPercent(Math.round(ratio * 100));
    if (ratio >= COMPLETION_THRESHOLD && markCompleteOnce(time)) return;

    const now = Date.now();
    if (now - lastSavedAt.current < SAVE_INTERVAL_MS) return;
    lastSavedAt.current = now;
    saveProgress(Math.min(time, maxReached.current), hasMarkedComplete.current);
  }

  function handleEnded(e: Event) {
    const media = e.currentTarget as HTMLMediaElement;
    const reachedNormally = media.currentTime - lastTime.current <= MAX_PLAYBACK_STEP;
    if (reachedNormally) {
      // Сүүлийн секундүүдийг тоолно.
      for (let s = Math.floor(lastTime.current); s < Math.ceil(media.duration); s++) watchedSeconds.current.add(s);
      maxReached.current = media.duration;
    } else if (!hasMarkedComplete.current) {
      // Төгсгөл рүү гүйлгэсэн — тооцохгүй, хамгийн хол үзсэн цэг рүү буцаана.
      media.currentTime = maxReached.current;
      lastTime.current = maxReached.current;
    }
    const ratio = watchedRatio(media.duration);
    setWatchedPercent(Math.round(ratio * 100));
    if (ratio >= COMPLETION_THRESHOLD) markCompleteOnce(0);
    // Хадгалах байрлал нь хамгийн хол БОДИТООР үзсэн цэгээс хэтрэхгүй.
    else saveProgress(Math.min(media.currentTime, maxReached.current), hasMarkedComplete.current);
  }

  return (
    <div>
      {/* isolate + translateZ: тоглож буй видеог Chrome-д бөөрөнхий булангаар заавал тайруулна. */}
      <div className="relative isolate aspect-[724/400] w-full overflow-hidden rounded-2xl bg-ink [transform:translateZ(0)]">
        {started ? (
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            startTime={startTime}
            autoPlay
            metadata={{ video_id: lessonId }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            style={
              {
                width: "100%",
                height: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                "--media-object-fit": "cover",
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
      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
        {completed ? (
          <span className="text-accent">✓ Энэ хичээлийг дуусгасан</span>
        ) : (
          <>
            <span className="text-ink/50">
              Видеоны 90%-ийг үзэхэд хичээл дуусна. Урагш гүйлгэх боломжгүй.
            </span>
            <span className="flex-shrink-0 font-medium text-brand-500">Үзсэн: {watchedPercent}%</span>
          </>
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
