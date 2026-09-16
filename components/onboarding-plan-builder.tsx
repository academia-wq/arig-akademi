"use client";

import { useState, useTransition } from "react";
import type { OnboardingPlan } from "@/lib/anthropic/onboarding-plan-schema";
import { SUPPORTED_FILE_ACCEPT } from "@/lib/constants/file-upload";
import { generatePlan, sendPlan } from "@/app/(admin)/admin/onboarding/actions";

export function OnboardingPlanBuilder() {
  const [isGenerating, startGenerating] = useTransition();
  const [isSending, startSending] = useTransition();
  const [plan, setPlan] = useState<OnboardingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentOk, setSentOk] = useState(false);

  const [employeeEmail, setEmployeeEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSentOk(false);
    const formData = new FormData(e.currentTarget);

    startGenerating(async () => {
      const result = await generatePlan(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPlan(result.plan);
    });
  }

  function handleSend() {
    if (!plan) return;
    const confirmed = window.confirm(
      `"${employeeEmail}" хаяг руу онбординг төлөвлөгөөг и-мэйлээр илгээх үү?`
    );
    if (!confirmed) return;

    setError(null);
    startSending(async () => {
      const result = await sendPlan(employeeEmail, companyName, jobTitle, plan);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSentOk(true);
    });
  }

  function reset() {
    setPlan(null);
    setSentOk(false);
    setError(null);
  }

  return (
    <div className="mt-6 rounded-lg border border-ink/10 bg-white p-4">
      {!plan && (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Ажилтны и-мэйл</label>
            <input
              name="employeeEmail"
              type="email"
              required
              value={employeeEmail}
              onChange={(e) => setEmployeeEmail(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink">Компанийн нэр</label>
              <input
                name="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Албан тушаал</label>
              <input
                name="jobTitle"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Компанийн дотоод журам (заавал биш)
            </label>
            <input name="file" type="file" accept={SUPPORTED_FILE_ACCEPT} className="mt-1 text-sm" />
            <p className="mt-1 text-xs text-ink/50">
              PDF, Word эсвэл Excel файл өгвөл AI түүний бодит агуулгад тулгуурлан төлөвлөгөө гаргана.
              Өгөхгүй бол салбарын жишиг дээр үндэслэсэн ноорог гаргана.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isGenerating}
            className="focus-ring rounded-md bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isGenerating ? "Үүсгэж байна... (хэдэн секунд болно)" : "Төлөвлөгөө үүсгэх"}
          </button>
        </form>
      )}

      {plan && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">
              Урьдчилан харах — {jobTitle} ({companyName})
            </h2>
            <span className="text-sm text-ink/50">{employeeEmail}</span>
          </div>

          <p className="whitespace-pre-wrap rounded-md bg-ink/5 p-3 text-sm text-ink">{plan.greeting}</p>

          <div>
            <h3 className="font-semibold text-ink">1-р долоо хоногийн төлөвлөгөө</h3>
            <div className="mt-2 space-y-2">
              {plan.weekOnePlan.map((day, i) => (
                <div key={i} className="rounded-md border border-ink/10 p-3">
                  <p className="font-medium text-ink">{day.day}</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-ink/70">
                    {day.tasks.map((task, j) => (
                      <li key={j}>{task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-ink">30 / 60 / 90 хоногийн төлөвлөгөө</h3>
            <div className="mt-2 space-y-3">
              {plan.phases.map((phase, i) => (
                <div key={i} className="rounded-md border border-ink/10 p-3">
                  <p className="font-semibold text-brand-700">
                    {phase.days} хоног — {phase.title}
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink">Чиглэл:</p>
                  <ul className="list-disc pl-5 text-sm text-ink/70">
                    {phase.focusAreas.map((f, j) => (
                      <li key={j}>{f}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-medium text-ink">Хэмжигдэхүүн (KPI):</p>
                  <ul className="list-disc pl-5 text-sm text-ink/70">
                    {phase.kpis.map((k, j) => (
                      <li key={j}>{k}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-ink">Гол амжилтын мөчүүд</h3>
            <ul className="mt-2 space-y-1 text-sm text-ink/70">
              <li>
                <strong className="text-ink">7 хоног:</strong> {plan.keyMilestones.day7}
              </li>
              <li>
                <strong className="text-ink">30 хоног:</strong> {plan.keyMilestones.day30}
              </li>
              <li>
                <strong className="text-ink">60 хоног:</strong> {plan.keyMilestones.day60}
              </li>
              <li>
                <strong className="text-ink">90 хоног:</strong> {plan.keyMilestones.day90}
              </li>
            </ul>
          </div>

          <div className="rounded-md bg-brand-500/5 p-3 text-sm text-ink">
            <strong>Стратегийн дүгнэлт (HR-т):</strong> {plan.strategicSummary}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {sentOk && (
            <p className="text-sm font-medium text-accent">
              Амжилттай илгээгдлээ — {employeeEmail}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || sentOk}
              className="focus-ring rounded-md bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSending ? "Илгээж байна..." : "Ажилтанд и-мэйлээр илгээх"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={isSending}
              className="focus-ring rounded-md border border-ink/15 px-4 py-2.5 font-medium hover:border-ink/30"
            >
              {sentOk ? "Шинэ төлөвлөгөө" : "Цуцлах"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
