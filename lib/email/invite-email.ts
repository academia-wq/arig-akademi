import "server-only";
import { Resend } from "resend";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Админ үүсгэсэн ажилтанд нууц үгээ тохируулах холбоос илгээнэ.
export async function sendEmployeeInviteEmail({
  email,
  fullName,
  link,
}: {
  email: string;
  fullName: string;
  link: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: `Ариг Академи <${from}>`,
    to: email,
    subject: "Ариг Академид тавтай морил — нууц үгээ тохируулна уу",
    html: `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.6;">
    <p>Сайн байна уу, ${escapeHtml(fullName)}!</p>
    <p>Таныг Ариг Академийн цахим сургалтын платформд бүртгэлээ. Доорх товчоор орж нууц үгээ тохируулна уу.</p>
    <p style="margin:28px 0;">
      <a href="${escapeHtml(link)}" style="background:#f87b4f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Нууц үг тохируулах</a>
    </p>
    <p style="color:#666;font-size:13px;">Холбоос хугацаатай. Хүчингүй болсон бол админаас шинэ холбоос авна уу.</p>
  </div>`,
  });

  if (error) throw new Error(error.message);
}
