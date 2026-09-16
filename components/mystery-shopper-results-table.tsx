"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";

type Evaluation = Database["public"]["Tables"]["mystery_shopper_evaluations"]["Row"];

type Answer = {
  questionNumber: number;
  section: string;
  question: string;
  maxScore: number;
  answer: boolean;
  score: number;
  note: string | null;
  imageUrls: string[];
};

type SortOption = "new" | "old" | "high" | "low";

function percentOf(evaluation: Evaluation) {
  return evaluation.max_score > 0 ? (evaluation.total_score / evaluation.max_score) * 100 : 0;
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(evaluations: Evaluation[]) {
  const header = ["Огноо", "Цаг", "Салбар", "Үнэлэгч", "Оноо", "Дээд оноо", "Хувь", "Коммент"];
  const rows = evaluations.map((e) => [
    e.evaluation_date,
    e.evaluation_time ?? "",
    e.branch_name,
    e.evaluator_name,
    String(e.total_score),
    String(e.max_score),
    `${Math.round(percentOf(e))}%`,
    e.comment ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nuuts-uilchluulegch-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function MysteryShopperResultsTable({ evaluations }: { evaluations: Evaluation[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("new");
  const [isRefreshing, startRefreshing] = useTransition();

  const branchSummary = useMemo(() => {
    const byBranch = new Map<string, { count: number; totalPercent: number }>();
    for (const e of evaluations) {
      const entry = byBranch.get(e.branch_name) ?? { count: 0, totalPercent: 0 };
      entry.count += 1;
      entry.totalPercent += percentOf(e);
      byBranch.set(e.branch_name, entry);
    }
    return Array.from(byBranch.entries())
      .map(([branch, { count, totalPercent }]) => ({
        branch,
        count,
        avgPercent: totalPercent / count,
      }))
      .sort((a, b) => b.avgPercent - a.avgPercent);
  }, [evaluations]);

  const visibleEvaluations = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? evaluations.filter(
          (e) =>
            e.branch_name.toLowerCase().includes(query) ||
            e.evaluator_name.toLowerCase().includes(query)
        )
      : evaluations;

    const sorted = [...filtered];
    switch (sortOption) {
      case "new":
        sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        break;
      case "old":
        sorted.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
        break;
      case "high":
        sorted.sort((a, b) => percentOf(b) - percentOf(a));
        break;
      case "low":
        sorted.sort((a, b) => percentOf(a) - percentOf(b));
        break;
    }
    return sorted;
  }, [evaluations, search, sortOption]);

  return (
    <div className="mt-6">
      {branchSummary.length > 0 && (
        <div className="mb-6 rounded-lg border border-ink/10 bg-white p-4">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">
            Салбаруудын дундаж дүн ({branchSummary.length} салбар)
          </h2>
          <div className="space-y-2">
            {branchSummary.map(({ branch, count, avgPercent }) => (
              <div key={branch} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-ink" title={branch}>
                  {branch}
                </span>
                <div className="h-2 flex-1 rounded-full bg-ink/5">
                  <div
                    className={`h-2 rounded-full ${
                      avgPercent >= 80 ? "bg-accent" : avgPercent >= 50 ? "bg-brand-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.round(avgPercent))}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm font-medium text-ink">
                  {Math.round(avgPercent)}%
                </span>
                <span className="w-14 shrink-0 text-right text-xs text-ink/40">{count} үнэлгээ</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Салбар эсвэл үнэлэгчээр хайх..."
          className="focus-ring w-full rounded-md border border-ink/15 px-3 py-2 text-sm sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="focus-ring rounded-md border border-ink/15 px-3 py-2 text-sm"
          >
            <option value="new">Шинэ нь эхэнд</option>
            <option value="old">Хуучин нь эхэнд</option>
            <option value="high">Өндөр оноо эхэнд</option>
            <option value="low">Бага оноо эхэнд</option>
          </select>
          <button
            type="button"
            onClick={() => downloadCsv(visibleEvaluations)}
            disabled={visibleEvaluations.length === 0}
            className="focus-ring rounded-md border border-ink/15 px-3 py-2 text-sm font-medium hover:border-ink/30 disabled:opacity-50"
          >
            ⬇ CSV татах
          </button>
          <button
            type="button"
            onClick={() => startRefreshing(() => router.refresh())}
            disabled={isRefreshing}
            className="focus-ring rounded-md border border-ink/15 px-3 py-2 text-sm font-medium hover:border-ink/30 disabled:opacity-50"
          >
            {isRefreshing ? "Шинэчилж байна..." : "↻ Шинэчлэх"}
          </button>
        </div>
      </div>

      {evaluations.length === 0 ? (
        <p className="mt-6 text-sm text-ink/50">Одоогоор ирсэн үнэлгээ алга байна.</p>
      ) : visibleEvaluations.length === 0 ? (
        <p className="mt-6 text-sm text-ink/50">Хайлтад тохирох үнэлгээ олдсонгүй.</p>
      ) : (
      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
          <tr>
            <th className="px-4 py-3">Огноо</th>
            <th className="px-4 py-3">Салбар</th>
            <th className="px-4 py-3">Үнэлэгч</th>
            <th className="px-4 py-3">Оноо</th>
            <th className="px-4 py-3">%</th>
          </tr>
        </thead>
        <tbody>
          {visibleEvaluations.map((evaluation) => {
            const isExpanded = expandedId === evaluation.id;
            const percent = Math.round((evaluation.total_score / evaluation.max_score) * 100);
            const answers = (evaluation.answers as Answer[] | null) ?? [];
            const sections = Array.from(new Set(answers.map((a) => a.section)));

            return (
              <Fragment key={evaluation.id}>
                <tr
                  onClick={() => setExpandedId(isExpanded ? null : evaluation.id)}
                  className="cursor-pointer border-t border-ink/10 hover:bg-ink/5"
                >
                  <td className="px-4 py-3 text-ink/70">
                    {evaluation.evaluation_date}
                    {evaluation.evaluation_time ? ` · ${evaluation.evaluation_time}` : ""}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{evaluation.branch_name}</td>
                  <td className="px-4 py-3 text-ink/70">{evaluation.evaluator_name}</td>
                  <td className="px-4 py-3 text-ink">
                    {evaluation.total_score}/{evaluation.max_score}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        percent >= 80
                          ? "bg-accent/10 text-accent"
                          : percent >= 50
                            ? "bg-brand-500/10 text-brand-700"
                            : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {percent}%
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-t border-ink/10 bg-ink/[0.02]">
                    <td colSpan={5} className="px-4 py-4">
                      {evaluation.comment && (
                        <p className="mb-4 rounded-md bg-white p-3 text-sm text-ink">
                          <span className="font-medium">Коммент: </span>
                          {evaluation.comment}
                        </p>
                      )}
                      <div className="space-y-5">
                        {sections.map((section) => (
                          <div key={section}>
                            <h3 className="mb-2 text-sm font-semibold text-ink">{section}</h3>
                            <div className="space-y-2">
                              {answers
                                .filter((a) => a.section === section)
                                .map((a) => (
                                  <div
                                    key={a.questionNumber}
                                    className="rounded-md border border-ink/10 bg-white p-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-sm text-ink">
                                        {a.questionNumber}. {a.question}
                                      </p>
                                      <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                          a.score === a.maxScore
                                            ? "bg-accent/10 text-accent"
                                            : "bg-red-500/10 text-red-600"
                                        }`}
                                      >
                                        {a.answer ? "Тийм" : "Үгүй"} · {a.score}/{a.maxScore}
                                      </span>
                                    </div>
                                    {a.note && <p className="mt-1 text-xs text-ink/60">{a.note}</p>}
                                    {a.imageUrls.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {a.imageUrls.map((url) => (
                                          <a key={url} href={url} target="_blank" rel="noreferrer">
                                            <img
                                              src={url}
                                              alt=""
                                              className="h-16 w-16 rounded-md border border-ink/10 object-cover"
                                            />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
      )}
    </div>
  );
}
