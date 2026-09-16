// Client component-с ч, server-only файлаас ч ашиглагддаг тул энд зөвхөн
// zod schema/type байрлуулна.
import { z } from "zod/v4";

const weekOneDaySchema = z.object({
  day: z.string(),
  tasks: z.array(z.string()).min(1).max(5),
});

const phaseSchema = z.object({
  days: z.number(),
  title: z.string(),
  focusAreas: z.array(z.string()).min(1).max(8),
  kpis: z.array(z.string()).min(1).max(6),
});

export const onboardingPlanSchema = z.object({
  greeting: z.string().max(2000),
  weekOnePlan: z.array(weekOneDaySchema).min(3).max(7),
  phases: z.array(phaseSchema).length(3),
  keyMilestones: z.object({
    day7: z.string(),
    day30: z.string(),
    day60: z.string(),
    day90: z.string(),
  }),
  strategicSummary: z.string().max(2000),
});

export type OnboardingPlan = z.infer<typeof onboardingPlanSchema>;
