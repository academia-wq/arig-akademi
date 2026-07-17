import { readFileSync } from "node:fs";
import { basename } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod/v4";

const COURSE_ID = process.argv[2];
const FILE_PATHS = process.argv.slice(3);

if (!COURSE_ID || FILE_PATHS.length === 0) {
  console.error("Usage: node import-course-drafts.mjs <courseId> <file1.pdf> [file2.pdf ...]");
  process.exit(1);
}

const MAX_SOURCE_TEXT_CHARS = 20000;

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  content_text: z.string().max(3000),
});
const moduleSchema = z.object({
  title: z.string().min(1).max(200),
  lessons: z.array(lessonSchema).min(1).max(30),
});
const courseDraftSchema = z.object({
  modules: z.array(moduleSchema).min(1).max(30),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic();

async function extractPdfText(buffer) {
  const doc = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(doc, { mergePages: true });
  return text.trim();
}

async function generateCourseDraftFromText(sourceText, sourceLabel) {
  const response = await anthropic.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    system:
      "Чи сургалтын хөтөлбөр боловсруулагч туслах. Өгөгдсөн баримтын агуулгыг үндэслэн курсыг логик дараалалтай бүлэг (module), бүлэг тус бүрт хичээл (lesson) болгон хуваа. Хичээл тус бүрд гарчгийн зэрэгцээ товч боловч утга учиртай агуулга (content_text) бич. Баримтын жинхэнэ агуулга дээр үндэслэ, зохиомол зүйл битгий нэм.",
    messages: [
      {
        role: "user",
        content: `Дараах материал нь "${sourceLabel}" файлаас гаралтай. Үүнээс курсын бүлэг/хичээлийн бүтэц гарга:\n\n${sourceText}`,
      },
    ],
    output_config: { format: zodOutputFormat(courseDraftSchema) },
  });
  if (!response.parsed_output) {
    throw new Error("AI курсын бүтэц үүсгэж чадсангүй.");
  }
  return response.parsed_output;
}

async function saveDraftStructure(courseId, draft) {
  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const moduleOffset = count || 0;
  const moduleRows = draft.modules.map((mod, index) => ({
    course_id: courseId,
    title: mod.title,
    position: moduleOffset + index,
  }));

  const { data: insertedModules, error: moduleError } = await supabase
    .from("modules")
    .insert(moduleRows)
    .select("id");

  if (moduleError || !insertedModules) {
    throw new Error(moduleError?.message || "Бүлэг үүсгэж чадсангүй.");
  }

  const lessonRows = draft.modules.flatMap((mod, modIndex) =>
    mod.lessons.map((lesson, lessonIndex) => ({
      module_id: insertedModules[modIndex].id,
      title: lesson.title,
      content_text: lesson.content_text,
      position: lessonIndex,
    }))
  );

  const { error: lessonError } = await supabase.from("lessons").insert(lessonRows);
  if (lessonError) {
    throw new Error(lessonError.message);
  }

  return { modules: insertedModules.length, lessons: lessonRows.length };
}

for (const filePath of FILE_PATHS) {
  const label = basename(filePath);
  try {
    console.log(`\n--- ${label} ---`);
    const buffer = readFileSync(filePath);
    const text = (await extractPdfText(buffer)).slice(0, MAX_SOURCE_TEXT_CHARS);
    if (!text) {
      console.log("  SKIP: текст олдсонгүй (скан зураг байж болзошгүй)");
      continue;
    }
    console.log(`  extracted ${text.length} chars, calling Claude...`);
    const draft = await generateCourseDraftFromText(text, label);
    const result = await saveDraftStructure(COURSE_ID, draft);
    console.log(`  OK: +${result.modules} бүлэг, +${result.lessons} хичээл`);
  } catch (err) {
    console.log(`  FAILED: ${err instanceof Error ? err.message : String(err)}`);
  }
}
