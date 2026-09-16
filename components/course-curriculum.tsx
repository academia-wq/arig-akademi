"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
} from "@/components/icons";
import { getLessonIllustration } from "@/lib/course-icon";

type Lesson = { id: string; title: string; position: number; image_url: string | null };
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

  let lessonCounter = 0;

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
                        <div className="grid grid-cols-2 gap-3 border-t border-ink/10 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5 lg:grid-cols-4">
                          {mod.lessons.map((lesson) => {
                            const done = completedSet.has(lesson.id);
                            const isResume = lesson.id === resumeLessonId;
                            const { tint, illustration } = getLessonIllustration(
                              lessonCounter++
                            );

                            return (
                              <Link
                                key={lesson.id}
                                prefetch={false}
                                href={`/learn/${courseSlug}/${lesson.id}`}
                                className={clsx(
                                  "focus-ring group flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-sm",
                                  isResume
                                    ? "border-brand-500 ring-1 ring-brand-500"
                                    : "border-ink/10 hover:border-brand-300"
                                )}
                              >
                                <div
                                  className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden ${
                                    lesson.image_url ? "bg-ink/5" : `p-3 ${tint}`
                                  }`}
                                >
                                  {lesson.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={lesson.image_url}
                                      alt=""
                                      className={clsx(
                                        "h-full w-full object-cover transition duration-300 group-hover:scale-105",
                                        !isResume && !done && "opacity-80"
                                      )}
                                    />
                                  ) : illustration ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={illustration}
                                      alt=""
                                      className={clsx(
                                        "h-full w-full object-contain transition duration-300 group-hover:scale-105",
                                        !isResume && !done && "opacity-80"
                                      )}
                                    />
                                  ) : null}

                                  {done && (
                                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                                      <CheckCircleIcon className="h-4 w-4" />
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-1 flex-col p-3">
                                  <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug text-ink">
                                    {lesson.title}
                                  </p>
                                  <p
                                    className={clsx(
                                      "mt-2 text-xs font-semibold uppercase tracking-wide",
                                      done
                                        ? "text-accent"
                                        : isResume
                                        ? "text-brand-500"
                                        : "text-ink/40"
                                    )}
                                  >
                                    {done ? "Дахих" : isResume ? "Үргэлжлүүлэх" : "Эхлэх"}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
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
