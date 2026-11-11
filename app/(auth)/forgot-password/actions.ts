"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { createPasswordResetLink } from "@/lib/employee-invite";
import { sendPasswordResetEmail } from "@/lib/email/invite-email";

const COOLDOWN_MS = 60_000; // нэг хаяг руу минутад нэгээс олон имэйл илгээхгүй

// Бүртгэл байгаа эсэхийг ил гаргахгүйн тулд хаяг олдсон эсэхээс үл хамааран ижил хариу өгнө.
export async function requestPasswordReset(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Имэйл хаягаа зөв оруулна уу." };
  }

  const admin = createServiceRoleClient();
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = list?.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) return { ok: true };

  const lastRequested = Number(user.app_metadata?.password_reset_requested_at || 0);
  if (Date.now() - lastRequested < COOLDOWN_MS) return { ok: true };
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, password_reset_requested_at: Date.now() },
  });

  const link = await createPasswordResetLink(email);
  if (!link) return { ok: true };
  try {
    await sendPasswordResetEmail({ email, link });
  } catch {
    // Имэйл илгээх домэйн баталгаажаагүй бол хүрэхгүй — хэрэглэгчид ялгаа харуулахгүй.
  }
  return { ok: true };
}
