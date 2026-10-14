"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { LessonCelebration } from "@/components/lesson-celebration";

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
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        startTime={startTime}
        metadata={{ video_id: lessonId }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          if (!markCompleteOnce(0)) saveProgress(0, true);
        }}
        style={{ aspectRatio: "16/9", width: "100%", borderRadius: "8px" }}
      />
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
