import "server-only";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmployeeInviteEmail } from "@/lib/email/invite-email";

export type InviteResult =
  | { success: true; link: string; emailed: boolean; resent: boolean }
  | { success: false; error: string };

// Ажилтныг нэр, имэйлээр нь шууд үүсгэж, /set-password холбоос гаргана (админ ба
// франчайзын менежер хоёулаа ашиглана). Нэвтэрч амжаагүй урилгыг дахин үүсгэвэл
// шинэ холбоос гаргана — гэхдээ зөвхөн canResend зөвшөөрсөн тохиолдолд (менежер өөр
// франчайзын/үндсэн хүнийг өөрийн франчайз руу татахаас сэргийлнэ).
export async function inviteEmployee(input: {
  fullName: string;
  email: string;
  department: string;
  position: string;
  employeeType: "core" | "franchise";
  franchiseId: string | null;
  canResend: (existing: { role: string | null; franchise_id: string | null } | null) => boolean;
}): Promise<InviteResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName || !email || !input.department || !input.position) {
    return { success: false, error: "Бүх талбарыг бөглөнө үү." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Имэйл хаяг буруу байна." };
  }

  const admin = createServiceRoleClient();
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { success: false, error: listError.message };
  const existing = list.users.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("role, franchise_id")
      .eq("id", existing.id)
      .maybeSingle();
    if (existing.last_sign_in_at || !input.canResend(existingProfile)) {
      return { success: false, error: "Энэ имэйлээр бүртгэл аль хэдийн байна." };
    }
  }

  const type = existing ? "magiclink" : "invite";
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type,
    email,
    options: { data: { full_name: fullName } },
  });
  if (linkError || !linkData.user) {
    return { success: false, error: linkError?.message || "Бүртгэл үүсгэж чадсангүй." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      department: input.department,
      position: input.position,
      employee_type: input.employeeType,
      franchise_id: input.franchiseId,
    })
    .eq("id", linkData.user.id);
  if (profileError) return { success: false, error: profileError.message };

  const origin =
    headers().get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://arig-akademi.vercel.app";
  const link = `${origin}/set-password?token_hash=${encodeURIComponent(
    linkData.properties.hashed_token
  )}&type=${type}`;

  let emailed = false;
  try {
    await sendEmployeeInviteEmail({ email, fullName, link });
    emailed = true;
  } catch {
    // Resend-ийн домэйн баталгаажаагүй үед зөвхөн эзэмшигчийн хаяг руу илгээнэ —
    // энэ тохиолдолд холбоосыг хуулж өгнө.
  }

  return { success: true, link, emailed, resent: !!existing };
}
