import "server-only";
import { Resend } from "resend";
import type { OnboardingPlan } from "@/lib/anthropic/onboarding-plan-schema";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderPlanHtml(plan: OnboardingPlan, companyName: string, jobTitle: string): string {
  const weekOneHtml = plan.weekOnePlan
    .map(
      (d) => `
      <div style="margin-bottom:12px;">
        <p style="margin:0;font-weight:600;color:#1a1a1a;">${escapeHtml(d.day)}</p>
        <ul style="margin:4px 0 0;padding-left:20px;color:#444;">
          ${d.tasks.map((t) => `<li style="margin-bottom:2px;">${escapeHtml(t)}</li>`).join("")}
        </ul>
      </div>`
    )
    .join("");

  const phasesHtml = plan.phases
    .map(
      (p) => `
      <div style="margin-bottom:20px;padding:16px;border:1px solid #eee;border-radius:8px;">
        <p style="margin:0 0 8px;font-weight:700;color:#c2410c;">${p.days} хоног: ${escapeHtml(p.title)}</p>
        <p style="margin:0 0 4px;font-weight:600;color:#1a1a1a;">Чиглэл:</p>
        <ul style="margin:0 0 10px;padding-left:20px;color:#444;">
          ${p.focusAreas.map((f) => `<li style="margin-bottom:2px;">${escapeHtml(f)}</li>`).join("")}
        </ul>
        <p style="margin:0 0 4px;font-weight:600;color:#1a1a1a;">Хэмжигдэхүүн (KPI):</p>
        <ul style="margin:0;padding-left:20px;color:#444;">
          ${p.kpis.map((k) => `<li style="margin-bottom:2px;">${escapeHtml(k)}</li>`).join("")}
        </ul>
      </div>`
    )
    .join("");

  return `
  <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
    <p style="text-transform:uppercase;letter-spacing:2px;font-size:12px;color:#c2410c;font-weight:700;">${escapeHtml(companyName)}</p>
    <h1 style="font-size:24px;margin:8px 0 20px;">Хөөрөх зурвас — ${escapeHtml(jobTitle)}</h1>

    <p style="line-height:1.6;white-space:pre-wrap;">${escapeHtml(plan.greeting)}</p>

    <h2 style="font-size:18px;margin-top:28px;">1-р долоо хоногийн төлөвлөгөө</h2>
    ${weekOneHtml}

    <h2 style="font-size:18px;margin-top:28px;">30 / 60 / 90 хоногийн төлөвлөгөө</h2>
    ${phasesHtml}

    <h2 style="font-size:18px;margin-top:28px;">Гол амжилтын мөчүүд</h2>
    <ul style="padding-left:20px;color:#444;line-height:1.7;">
      <li><strong>7 хоног:</strong> ${escapeHtml(plan.keyMilestones.day7)}</li>
      <li><strong>30 хоног:</strong> ${escapeHtml(plan.keyMilestones.day30)}</li>
      <li><strong>60 хоног:</strong> ${escapeHtml(plan.keyMilestones.day60)}</li>
      <li><strong>90 хоног:</strong> ${escapeHtml(plan.keyMilestones.day90)}</li>
    </ul>

    <p style="margin-top:28px;padding:16px;background:#fef8f1;border-radius:8px;line-height:1.6;">
      <strong>Стратегийн дүгнэлт (HR-т):</strong><br/>${escapeHtml(plan.strategicSummary)}
    </p>
  </div>`;
}

export async function sendOnboardingPlanEmail({
  employeeEmail,
  companyName,
  jobTitle,
  plan,
}: {
  employeeEmail: string;
  companyName: string;
  jobTitle: string;
  plan: OnboardingPlan;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { data, error } = await resend.emails.send({
    from: `${companyName} Onboarding <${from}>`,
    to: employeeEmail,
    subject: `${companyName}-д тавтай морил! Таны эхний 90 хоногийн төлөвлөгөө`,
    html: renderPlanHtml(plan, companyName, jobTitle),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
