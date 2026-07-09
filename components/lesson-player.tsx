"use client";

import { useCallback, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

const COMPLETION_THRESHOLD = 0.9; // 90%+ үзвэл дууссанд тооцно (спек 4.3.4)
const SAVE_INTERVAL_MS = 10_000; // 10 секунд тутамд хадгална (спек 4.3.3)

export function LessonPlayer({
  lessonId,
  playbackId,
  startTime,
  initiallyCompleted,
}: {
  lessonId: string;
  playbackId: string;
  startTime: number;
  initiallyCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initiallyCompleted);
  const lastSavedAt = useRef(0);
  const hasMarkedComplete = useRef(initiallyCompleted);

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
    const justCompleted = !hasMarkedComplete.current && ratio >= COMPLETION_THRESHOLD;

    if (justCompleted) {
      hasMarkedComplete.current = true;
      setCompleted(true);
    }

    saveProgress(media.currentTime, hasMarkedComplete.current);
  }

  function handleMarkComplete() {
    hasMarkedComplete.current = true;
    setCompleted(true);
    saveProgress(0, true);
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
          hasMarkedComplete.current = true;
          setCompleted(true);
          saveProgress(0, true);
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
    </div>
  );
}
