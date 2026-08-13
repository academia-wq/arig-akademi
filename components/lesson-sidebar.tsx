"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  CircleIcon,
  FolderIcon,
  PlayCircleIcon,
} from "@/components/icons";

type Lesson = { id: string; title: string; position: number };
type Module = { id: string; title: string; lessons: Lesson[] };
type CategoryGroup = { category: string | null; modules: Module[] };

export function LessonSidebar({
  courseSlug,
  categoryGroups,
  currentLessonId,
  completedLessonIds,
}: {
  courseSlug: string;
  categoryGroups: CategoryGroup[];
  currentLessonId: string;
  completedLessonIds: string[];
}) {
  const completedSet = new Set(completedLessonIds);

  const initiallyOpen = new Set(
    categoryGroups
      .filter((g) =>
        g.modules.some((m) => m.lessons.some((l) => l.id === currentLessonId))
      )
      .map((g) => g.category)
  );
  const [openCategories, setOpenCategories] = useState(initiallyOpen);

  function toggle(category: string | null) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <nav className="space-y-4 rounded-lg border border-ink/10 bg-white p-3">
      {categoryGroups.map((group, groupIndex) => {
        const key = group.category || `no-category-${groupIndex}`;
        const isOpen = !group.category || openCategories.has(group.category);
        return (
          <div key={key}>
            {group.category && (
              <button
                type="button"
                onClick={() => toggle(group.category)}
                className="focus-ring flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs font-bold uppercase tracking-wide text-brand-600 hover:bg-brand-50"
              >
                <ChevronRightIcon
                  className={clsx(
                    "h-3.5 w-3.5 flex-shrink-0 transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
                <FolderIcon className="h-4 w-4 flex-shrink-0" />
                {group.category}
              </button>
            )}
            {isOpen && (
              <div className="mt-3 space-y-5 pl-1">
                {group.modules.map((mod) => (
                  <div key={mod.id}>
                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
                      {mod.title}
                    </p>
                    <ul className="space-y-0.5">
                      {mod.lessons.map((lesson) => {
                        const done = completedSet.has(lesson.id);
                        const active = lesson.id === currentLessonId;
                        const Icon = done
                          ? CheckCircleIcon
                          : active
                          ? PlayCircleIcon
                          : CircleIcon;
                        return (
                          <li key={lesson.id}>
                            <Link
                              prefetch={false}
                              href={`/learn/${courseSlug}/${lesson.id}`}
                              className={clsx(
                                "focus-ring flex items-center gap-2.5 rounded-md px-2 py-2 text-sm",
                                active
                                  ? "bg-brand-50 font-medium text-brand-700"
                                  : "text-ink/70 hover:bg-ink/5"
                              )}
                            >
                              <Icon
                                className={clsx(
                                  "h-4 w-4 flex-shrink-0",
                                  done
                                    ? "text-accent"
                                    : active
                                    ? "text-brand-500"
                                    : "text-ink/25"
                                )}
                              />
                              <span className="truncate">{lesson.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
