"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  PlayCircleIcon,
} from "@/components/icons";
import { formatDuration } from "@/lib/format";

type Lesson = {
  id: string;
  title: string;
  duration_seconds: number | null;
};
type Module = { id: string; title: string; lessons: Lesson[] };

export function LessonCurriculumList({
  courseSlug,
  modules,
  currentLessonId,
  completedLessonIds,
}: {
  courseSlug: string;
  modules: Module[];
  currentLessonId: string;
  completedLessonIds: string[];
}) {
  const completedSet = new Set(completedLessonIds);

  const initiallyOpen = new Set(
    modules
      .filter((m) => m.lessons.some((l) => l.id === currentLessonId))
      .map((m) => m.id)
  );
  const [openModules, setOpenModules] = useState(initiallyOpen);

  function toggle(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {modules.map((mod) => {
        const total = mod.lessons.length;
        const completed = mod.lessons.filter((l) => completedSet.has(l.id)).length;
        const inProgress = completed > 0 && completed < total;
        const done = total > 0 && completed === total;
        const open = openModules.has(mod.id);

        return (
          <div key={mod.id} className="overflow-hidden rounded-lg border border-ink/10">
            <button
              type="button"
              onClick={() => toggle(mod.id)}
              className={clsx(
                "focus-ring flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left",
                done ? "bg-[#F1F4F8]" : inProgress ? "bg-[#EEF4FC]" : "bg-white"
              )}
            >
              <span className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-accent" />
                ) : inProgress ? (
                  <PlayCircleIcon className="h-5 w-5 flex-shrink-0 text-brand-500" />
                ) : (
                  <CircleIcon className="h-5 w-5 flex-shrink-0 text-ink/25" />
                )}
                <span className="font-medium text-ink">{mod.title}</span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-3">
                <span
                  className={clsx(
                    "text-sm",
                    done ? "text-accent" : inProgress ? "text-brand-500" : "text-ink/40"
                  )}
                >
                  {done
                    ? `${completed} / ${total} Дууссан`
                    : inProgress
                    ? `Явагдаж байна (${completed}/${total})`
                    : `${total} хичээл`}
                </span>
                <ChevronDownIcon
                  className={clsx(
                    "h-4 w-4 text-ink/40 transition-transform",
                    open && "rotate-180"
                  )}
                />
              </span>
            </button>

            {open && (
              <ul className="border-t border-ink/10">
                {mod.lessons.map((lesson, i) => {
                  const lessonDone = completedSet.has(lesson.id);
                  const isCurrent = lesson.id === currentLessonId;
                  const duration = formatDuration(lesson.duration_seconds || 0);
                  return (
                    <li key={lesson.id}>
                      <Link
                        prefetch={false}
                        href={`/learn/${courseSlug}/${lesson.id}`}
                        className={clsx(
                          "flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition hover:bg-ink/[0.02]",
                          i > 0 && "border-t border-ink/5",
                          isCurrent && "bg-brand-50"
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {lessonDone ? (
                            <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-accent" />
                          ) : isCurrent ? (
                            <PlayCircleIcon className="h-4 w-4 flex-shrink-0 text-brand-500" />
                          ) : (
                            <CircleIcon className="h-4 w-4 flex-shrink-0 text-ink/25" />
                          )}
                          <span
                            className={clsx(
                              "truncate",
                              isCurrent ? "font-medium text-brand-700" : "text-ink"
                            )}
                          >
                            {lesson.title}
                          </span>
                        </span>
                        <span className="flex-shrink-0 text-xs text-ink/40">
                          {isCurrent ? (
                            <span className="font-medium text-brand-500">Одоогийн хичээл</span>
                          ) : (
                            duration || "—"
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
