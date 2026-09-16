import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { onboardingPlanSchema, type OnboardingPlan } from "./onboarding-plan-schema";

export type { OnboardingPlan };

const SYSTEM_PROMPT = `Чи дэлхийн жишигт нийцсэн HR захирал бөгөөд "Onboarding" мэргэжилтэн юм.
Зорилго чинь: шинэ ажилтныг "Эхний өдрөөсөө үр бүтээлтэй ажиллах" соёлд сургах, компанид хурдан дасан зохицож, гүйцэтгэлээ эрт харуулахад чиглэсэн хувьчилсан 30-60-90 хоногийн онбординг төлөвлөгөө боловсруулна.

Дүрэм:
- 30 хоног (Суралцах): байгууллагын соёл, үйлчилгээний стандарт, дотоод харилцаатай танилцуулахад чиглэнэ.
- 60 хоног (Гүйцэтгэл): ажилтныг бие даан үүрэг даалгавар гүйцэтгэж эхлэх, жижиг ажилбарууд гардан авахад чиглэнэ.
- 90 хоног (Үр дүн): ажилтныг багийн нийт амжилтад бодит хувь нэмэр оруулахад чиглэнэ.
- Үе шат бүрд тодорхой, хэмжигдэхүйц KPI (Acceptance Criteria) заавал оруул.
- 1-р долоо хоногийг өдрөөр нь задалж, өдөр бүрт хийх тодорхой ажлууд бич.
- Хэрэв компанийн дотоод журмын баримт өгөгдсөн бол түүний бодит агуулгад тулгуурлаж бич, зохиомол зүйл битгий нэм. Баримт өгөгдөөгүй бол тухайн ажлын байранд зориулсан салбарын шилдэг туршлагад тулгуурласан жишээ төлөвлөгөө гарга.
- Мэндчилгээ хэсэг нь ажилтныг урам зоригтой угтах, найрсаг өнгө аястай байх ёстой.
- Стратегийн дүгнэлт хэсэг нь HR/удирдлагад энэ ажилтны амжилтад хүрэх магадлал, анхаарах эрсдэлийн талаар шийдвэр гаргахад туслах товч дүгнэлт байна.`;

export async function generateOnboardingPlan({
  companyName,
  jobTitle,
  sourceText,
}: {
  companyName: string;
  jobTitle: string;
  sourceText?: string;
}): Promise<OnboardingPlan> {
  const client = new Anthropic();

  const context = sourceText
    ? `Компанийн дотоод журам, стандартын баримт бичгээс иш татаж, доорх мэдээлэлд тулгуурлан "${jobTitle}" албан тушаалд тохирсон онбординг төлөвлөгөө гарга:\n\n${sourceText}`
    : `Компанийн дотоод баримт бичиг өгөгдөөгүй тул "${jobTitle}" албан тушаалд зориулж, ерөнхий салбарын шилдэг туршлагад тулгуурласан жишээ төлөвлөгөө гарга.`;

  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Компанийн нэр: ${companyName}\nАлбан тушаал: ${jobTitle}\n\n${context}`,
      },
    ],
    output_config: { format: zodOutputFormat(onboardingPlanSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("AI онбординг төлөвлөгөө үүсгэж чадсангүй. Дахин оролдоно уу.");
  }

  return response.parsed_output;
}
