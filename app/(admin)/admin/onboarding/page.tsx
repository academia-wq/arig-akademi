import { OnboardingPlanBuilder } from "@/components/onboarding-plan-builder";

export default function AdminOnboardingPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Хөөрөх зурвас</h1>
      <p className="mt-1 text-sm text-ink/60">
        Шинэ ажилтны и-мэйл, компанийн нэр, албан тушаалыг оруулж, AI-гаар хувьчилсан
        30/60/90 хоногийн онбординг төлөвлөгөө үүсгэн, шууд и-мэйлээр илгээнэ.
      </p>
      <OnboardingPlanBuilder />
    </div>
  );
}
