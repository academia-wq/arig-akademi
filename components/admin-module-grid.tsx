"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { SearchIcon, TrashIcon, BookIcon } from "@/components/icons";
import { formatDuration, initialsOf } from "@/lib/format";
import { EditModuleButton } from "@/components/edit-module-modal";
import { deleteModuleAdmin } from "@/app/(app)/admin/actions";

export type ModuleCard = {
  id: string;
  title: string;
  category: string | null;
  courseId: string;
  courseTitle: string;
  isPublished: boolean;
  instructorName: string;
  instructorAvatar: string | null;
  thumbnailUrl: string | null;
  lessonCount: number;
  durationSeconds: number;
};

export function AdminModuleGrid({
  modules,
  courseOptions,
}: {
  modules: ModuleCard[];
  courseOptions: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "draft">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(m: ModuleCard) {
    if (!confirm(`"${m.title}" сургалтыг устгах уу? Доторх бүх хичээл устна.`)) return;
    setDeletingId(m.id);
    const result = await deleteModuleAdmin(m.id);
    setDeletingId(null);
    if (result.success) router.refresh();
    else alert(result.error);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (filter === "draft" && m.isPublished) return false;
      if (!q) return true;
      return [m.title, m.category, m.courseTitle].some((v) =>
        (v || "").toLowerCase().includes(q)
      );
    });
  }, [modules, query, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[319px]">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9DA2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Сургалт хайх..."
            className="focus-ring h-[39px] w-full rounded-[7.5px] border border-[#D9D9D9] bg-paper pl-10 pr-3 text-sm text-ink placeholder:text-[#8A9DA2]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={clsx(
              "focus-ring h-[39px] rounded-[7.5px] px-5 text-sm font-medium transition",
              filter === "all"
                ? "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                : "border border-[#D9D9D9] bg-paper text-[#8A9DA2] hover:border-ink/30"
            )}
          >
            Бүгд
          </button>
          <button
            type="button"
            onClick={() => setFilter("draft")}
            className={clsx(
              "focus-ring h-[39px] rounded-[7.5px] px-5 text-sm font-medium transition",
              filter === "draft"
                ? "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                : "border border-[#D9D9D9] bg-paper text-[#8A9DA2] hover:border-ink/30"
            )}
          >
            Ноорог
          </button>
        </div>

        <p className="text-sm text-[#8A9DA2] sm:ml-auto">{filtered.length} сургалт</p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="flex h-[360px] flex-col overflow-hidden rounded-2xl border border-ink/15 bg-white"
          >
            <div className="relative h-[40%] flex-shrink-0 overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50">
              {m.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookIcon className="h-10 w-10 text-brand-300" />
                </div>
              )}
              <span
                className={clsx(
                  "absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium",
                  m.isPublished ? "bg-white/90 text-emerald-700" : "bg-white/90 text-ink/50"
                )}
              >
                {m.isPublished ? "Нийтлэгдсэн" : "Ноорог"}
              </span>
            </div>

            <div className="flex h-[60%] min-h-0 flex-col p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                  {m.instructorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.instructorAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(m.instructorName, null)
                  )}
                </span>
                <span className="truncate text-xs font-medium text-ink/60">
                  {m.instructorName}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 min-h-[3rem] font-display font-semibold leading-6 text-ink">
                {m.title}
              </p>
              <p className="mt-1 text-xs text-ink/50">
                {m.lessonCount} хичээл
                {m.durationSeconds > 0 ? ` | ${formatDuration(m.durationSeconds)}` : ""}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-4">
                <EditModuleButton
                  moduleId={m.id}
                  title={m.title}
                  category={m.category}
                  courseId={m.courseId}
                  courses={courseOptions}
                />
                <button
                  type="button"
                  onClick={() => handleDelete(m)}
                  disabled={deletingId === m.id}
                  aria-label="Устгах"
                  className="focus-ring flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-md border border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 disabled:opacity-60"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-ink/50">
            Сургалт олдсонгүй.
          </p>
        )}
      </div>
    </div>
  );
}
