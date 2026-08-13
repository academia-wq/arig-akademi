"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleIcon,
  FolderIcon,
  PlayCircleIcon,
} from "@/components/icons";

type Lesson = { id: string; title: string; position: number };
type Module = { id: string; title: string; lessons: Lesson[] };
type CategoryGroup = { category: string | null; modules: Module[] };

export function CourseCurriculum({
  courseSlug,
  categoryGroups,
  completedLessonIds,
  resumeLessonId,
}: {
  courseSlug: string;
  categoryGroups: CategoryGroup[];
  completedLessonIds: string[];
  resumeLessonId: string;
}) {
  const completedSet = new Set(completedLessonIds);

  const initiallyOpenModules = new Set(
    categoryGroups
      .flatMap((g) => g.modules)
      .filter((m) => m.lessons.some((l) => l.id === resumeLessonId))
      .map((m) => m.id)
  );
  if (initiallyOpenModules.size === 0) {
    const firstModule = categoryGroups[0]?.modules[0];
    if (firstModule) initiallyOpenModules.add(firstModule.id);
  }

  const [openModules, setOpenModules] = useState(initiallyOpenModules);
  const [openCategories, setOpenCategories] = useState(
    new Set(categoryGroups.map((g) => g.category))
  );

  function toggleModule(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(category: string | null) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {categoryGroups.map((group, groupIndex) => {
        const key = group.category || `no-category-${groupIndex}`;
        const categoryOpen = !group.category || openCategories.has(group.category);

        return (
          <div key={key}>
            {group.category && (
              <button
                type="button"
                onClick={() => toggleCategory(group.category)}
                className="focus-ring mb-3 flex w-full items-center gap-2 rounded-md py-1 text-left text-xs font-semibold uppercase tracking-wide text-brand-600 hover:text-brand-700"
              >
                <ChevronRightIcon
                  className={clsx(
                    "h-3.5 w-3.5 transition-transform",
                    categoryOpen && "rotate-90"
                  )}
                />
                <FolderIcon className="h-4 w-4" />
                {group.category}
              </button>
            )}

            {categoryOpen && (
              <div className="space-y-3">
                {group.modules.map((mod) => {
                  const moduleOpen = openModules.has(mod.id);
                  const completedInModule = mod.lessons.filter((l) =>
                    completedSet.has(l.id)
                  ).length;

                  return (
                    <div
                      key={mod.id}
                      className="overflow-hidden rounded-lg border border-ink/10 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        aria-expanded={moduleOpen}
                        className="focus-ring flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-ink/[0.02] sm:px-5"
                      >
                        <span>
                          <span className="block font-display font-semibold text-ink">
                            {mod.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink/50">
                            {mod.lessons.length} хичээл
                            {completedInModule > 0 &&
                              ` · ${completedInModule}/${mod.lessons.length} дууссан`}
                          </span>
                        </span>
                        <ChevronDownIcon
                          className={clsx(
                            "h-5 w-5 flex-shrink-0 text-ink/40 transition-transform",
                            moduleOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {moduleOpen && (
                        <ul>
                          {mod.lessons.map((lesson) => {
                            const done = completedSet.has(lesson.id);
                            const isResume = lesson.id === resumeLessonId;
                            const Icon = done
                              ? CheckCircleIcon
                              : isResume
                              ? PlayCircleIcon
                              : CircleIcon;

                            return (
                              <li
                                key={lesson.id}
                                className="flex items-center justify-between gap-4 border-t border-ink/10 px-4 py-3 sm:px-5"
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <Icon
                                    className={clsx(
                                      "h-5 w-5 flex-shrink-0",
                                      done
                                        ? "text-accent"
                                        : isResume
                                        ? "text-brand-500"
                                        : "text-ink/25"
                                    )}
                                  />
                                  <span className="truncate text-sm text-ink/80">
                                    {lesson.title}
                                  </span>
                                </span>
                                <Link
                                  prefetch={false}
                                  href={`/learn/${courseSlug}/${lesson.id}`}
                                  className="focus-ring flex-shrink-0 rounded-full bg-brand-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-brand-900"
                                >
                                  {done ? "Дахих" : isResume ? "Үргэлжлүүлэх" : "Эхлэх"}
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
            )}
          </div>
        );
      })}
    </div>
  );
}
