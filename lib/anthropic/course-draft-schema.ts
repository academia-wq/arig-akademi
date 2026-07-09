// Client component-с (type-only) ч, server-only файлаас ч ашиглагддаг тул энд
// зөвхөн zod schema/type байрлуулна — Anthropic SDK, unpdf, mammoth, xlsx зэрэг
// Node-only сангуудыг энд импортлохгүй.
import { z } from "zod/v4";

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  content_text: z.string().max(3000),
});

const moduleSchema = z.object({
  title: z.string().min(1).max(200),
  lessons: z.array(lessonSchema).min(1).max(30),
});

export const courseDraftSchema = z.object({
  modules: z.array(moduleSchema).min(1).max(30),
});

export type CourseDraft = z.infer<typeof courseDraftSchema>;
