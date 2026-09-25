"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { calculateQuestionScore, getApplicableQuestions } from "@/lib/mystery-shopper/questions";

const SUPPORTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES_PER_QUESTION = 3;

type AnswerInput = {
  questionNumber: number;
  answer: boolean;
  note: string;
};

type SubmitResult =
  | { success: true; totalScore: number; maxScore: number }
  | { success: false; error: string };

export async function submitMysteryShopperEvaluation(formData: FormData): Promise<SubmitResult> {
  const branchName = String(formData.get("branchName") || "").trim();
  const evaluationDate = String(formData.get("evaluationDate") || "").trim();
  const evaluatorName = String(formData.get("evaluatorName") || "").trim();
  const evaluationTime = String(formData.get("evaluationTime") || "").trim();
  const comment = String(formData.get("comment") || "").trim();
  const answersRaw = String(formData.get("answers") || "[]");
  const hasOutdoorAndRestroom = String(formData.get("hasOutdoorAndRestroom") || "true") === "true";

  if (!branchName) return { success: false, error: "Салбарын нэрийг оруулна уу." };
  if (!evaluationDate) return { success: false, error: "Огноог оруулна уу." };
  if (!evaluatorName) return { success: false, error: "Үнэлэгчийн нэрийг оруулна уу." };

  let parsedAnswers: AnswerInput[];
  try {
    parsedAnswers = JSON.parse(answersRaw);
  } catch {
    return { success: false, error: "Хариултын өгөгдөл алдаатай байна." };
  }

  const applicableQuestions = getApplicableQuestions(hasOutdoorAndRestroom);
  const answerByNumber = new Map(parsedAnswers.map((a) => [a.questionNumber, a]));

  for (const question of applicableQuestions) {
    const answer = answerByNumber.get(question.number);
    if (!answer || typeof answer.answer !== "boolean") {
      return { success: false, error: `${question.number}-р асуултад хариулаагүй байна.` };
    }
  }

  const evaluationId = randomUUID();
  const supabase = createServiceRoleClient();

  const finalAnswers: Array<{
    questionNumber: number;
    section: string;
    question: string;
    maxScore: number;
    answer: boolean;
    score: number;
    note: string | null;
    imageUrls: string[];
  }> = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const question of applicableQuestions) {
    const answer = answerByNumber.get(question.number)!;
    const score = calculateQuestionScore(question, answer.answer);
    totalScore += score;
    maxScore += question.maxScore;

    const imageUrls: string[] = [];
    for (let i = 0; i < MAX_IMAGES_PER_QUESTION; i++) {
      const file = formData.get(`image_q${question.number}_${i}`);
      if (!(file instanceof File) || file.size === 0) continue;

      if (!SUPPORTED_IMAGE_MIME_TYPES.includes(file.type)) {
        return {
          success: false,
          error: `${question.number}-р асуултын зураг дэмжигдэхгүй төрөлтэй байна (JPEG, PNG, WEBP, GIF).`,
        };
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return { success: false, error: `${question.number}-р асуултын зураг 8MB-с хэтэрсэн байна.` };
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${evaluationId}/q${question.number}-${i}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("mystery-shopper-images")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from("mystery-shopper-images")
        .getPublicUrl(path);
      imageUrls.push(publicUrlData.publicUrl);
    }

    finalAnswers.push({
      questionNumber: question.number,
      section: question.section,
      question: question.text,
      maxScore: question.maxScore,
      answer: answer.answer,
      score,
      note: answer.note?.trim() || null,
      imageUrls,
    });
  }

  const { error: insertError } = await supabase.from("mystery_shopper_evaluations").insert({
    id: evaluationId,
    branch_name: branchName,
    evaluation_date: evaluationDate,
    evaluator_name: evaluatorName,
    evaluation_time: evaluationTime || null,
    comment: comment || null,
    total_score: totalScore,
    max_score: maxScore,
    answers: finalAnswers,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath("/admin");
  return { success: true, totalScore, maxScore };
}
