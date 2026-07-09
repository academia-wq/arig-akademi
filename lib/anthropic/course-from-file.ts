import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { courseDraftSchema, type CourseDraft } from "./course-draft-schema";

export type { CourseDraft };

// Зардлыг хязгаарлахын тулд файлаас уншсан текстийг боломжийн хэмжээгээр
// хязгаарласан.
const MAX_SOURCE_TEXT_CHARS = 20000;

async function extractPdfText(buffer: Buffer): Promise<string> {
  const doc = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(doc, { mergePages: true });
  return text.trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value.trim();
}

function extractSpreadsheetText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const parts = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet).trim();
    return csv ? `# ${sheetName}\n${csv}` : "";
  }).filter(Boolean);
  return parts.join("\n\n").trim();
}

/**
 * Файлын MIME төрлөөс хамааран текст задлана. Дэмжигдэхгүй төрөл эсвэл
 * текстгүй файл (жишээ нь скан хийсэн зураг PDF) бол ойлгомжтой алдаа шидэнэ.
 */
export async function extractFileText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  let text: string;

  switch (mimeType) {
    case "application/pdf":
      text = await extractPdfText(buffer);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      text = await extractDocxText(buffer);
      break;
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      text = extractSpreadsheetText(buffer);
      break;
    default:
      throw new Error("Дэмжигдэхгүй файлын төрөл.");
  }

  if (!text) {
    throw new Error(
      "Файлаас текст олдсонгүй. Энэ нь скан хийсэн зураг эсвэл хоосон байж болзошгүй."
    );
  }

  return text.slice(0, MAX_SOURCE_TEXT_CHARS);
}

export async function generateCourseDraftFromText(
  sourceText: string
): Promise<CourseDraft> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system:
      "Чи сургалтын хөтөлбөр боловсруулагч туслах. Өгөгдсөн баримтын агуулгыг үндэслэн курсыг логик дараалалтай бүлэг (module), бүлэг тус бүрт хичээл (lesson) болгон хуваа. Хичээл тус бүрд гарчгийн зэрэгцээ товч боловч утга учиртай агуулга (content_text) бич. Баримтын жинхэнэ агуулга дээр үндэслэ, зохиомол зүйл битгий нэм.",
    messages: [
      {
        role: "user",
        content: `Дараах материалаас курсын бүлэг/хичээлийн бүтэц гарга:\n\n${sourceText}`,
      },
    ],
    output_config: { format: zodOutputFormat(courseDraftSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("AI курсын бүтэц үүсгэж чадсангүй. Дахин оролдоно уу.");
  }

  return response.parsed_output;
}
