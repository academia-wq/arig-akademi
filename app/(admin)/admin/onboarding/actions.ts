"use server";

import { getUser, createClient } from "@/lib/supabase/server";
import { extractFileText } from "@/lib/anthropic/course-from-file";
import { generateOnboardingPlan, type OnboardingPlan } from "@/lib/anthropic/onboarding-plan";
import { sendOnboardingPlanEmail } from "@/lib/email/onboarding-email";
import { SUPPORTED_MIME_TYPES } from "@/lib/constants/file-upload";

const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024;
const ONBOARDING_FEATURE = "onboarding_plan_generate";
const ONBOARDING_DAILY_LIMIT = 10;

async function requireAdminOrInstructor() {
  const user = await getUser();
  if (!user) return { user: null, supabase: null } as const;

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "instructor") {
    return { user: null, supabase: null } as const;
  }

  return { user, supabase } as const;
}

export async function generatePlan(
  formData: FormData
): Promise<{ success: true; plan: OnboardingPlan } | { success: false; error: string }> {
  const { user, supabase } = await requireAdminOrInstructor();
  if (!user || !supabase) return { success: false, error: "Энэ үйлдэлд эрх хүрэлцэхгүй байна." };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: usageCount } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("feature", ONBOARDING_FEATURE)
    .gte("created_at", since);

  if ((usageCount || 0) >= ONBOARDING_DAILY_LIMIT) {
    return {
      success: false,
      error: `Өдрийн хязгаар (${ONBOARDING_DAILY_LIMIT} удаа/24 цаг) хүрсэн байна. Маргааш дахин оролдоно уу.`,
    };
  }

  const companyName = ((formData.get("companyName") as string) || "").trim();
  const jobTitle = ((formData.get("jobTitle") as string) || "").trim();
  const employeeEmail = ((formData.get("employeeEmail") as string) || "").trim();

  if (!companyName || !jobTitle || !employeeEmail) {
    return {
      success: false,
      error: "Компанийн нэр, албан тушаал, ажилтны имэйл заавал бөглөнө үү.",
    };
  }

  let sourceText: string | undefined;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (!SUPPORTED_MIME_TYPES.includes(file.type as (typeof SUPPORTED_MIME_TYPES)[number])) {
      return { success: false, error: "Зөвхөн PDF, Word (.docx) эсвэл Excel (.xlsx/.xls) файл дэмжигдэнэ." };
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      return { success: false, error: "Файлын хэмжээ 15MB-с хэтэрсэн байна." };
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      sourceText = await extractFileText(buffer, file.type);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Файл боловсруулахад алдаа гарлаа.",
      };
    }
  }

  try {
    const plan = await generateOnboardingPlan({ companyName, jobTitle, sourceText });
    await supabase.from("ai_usage_logs").insert({ user_id: user.id, feature: ONBOARDING_FEATURE });
    return { success: true, plan };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI төлөвлөгөө үүсгэхэд алдаа гарлаа.",
    };
  }
}

export async function sendPlan(
  employeeEmail: string,
  companyName: string,
  jobTitle: string,
  plan: OnboardingPlan
): Promise<{ success: true } | { success: false; error: string }> {
  const { user, supabase } = await requireAdminOrInstructor();
  if (!user || !supabase) return { success: false, error: "Энэ үйлдэлд эрх хүрэлцэхгүй байна." };

  try {
    await sendOnboardingPlanEmail({ employeeEmail, companyName, jobTitle, plan });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Имэйл илгээхэд алдаа гарлаа.",
    };
  }

  await supabase.from("onboarding_plans").insert({
    employee_email: employeeEmail,
    company_name: companyName,
    job_title: jobTitle,
    plan,
    created_by: user.id,
    sent_at: new Date().toISOString(),
  });

  return { success: true };
}
