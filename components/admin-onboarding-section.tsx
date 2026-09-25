import { OnboardingPlanBuilder } from "@/components/onboarding-plan-builder";

export function AdminOnboardingSection() {
  return (
    <div>
      <p className="mb-4 text-sm text-ink/60">
        Шинэ ажилтны и-мэйл, компанийн нэр, албан тушаалыг оруулж, AI-гаар хувьчилсан 30/60/90
        хоногийн онбординг төлөвлөгөө үүсгэн, шууд и-мэйлээр илгээнэ.
      </p>
      <OnboardingPlanBuilder />
    </div>
  );
}
