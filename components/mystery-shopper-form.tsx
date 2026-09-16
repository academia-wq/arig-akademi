"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  MYSTERY_SHOPPER_QUESTIONS,
  calculateQuestionScore,
  getMaxScoreFor,
  questionsBySection,
  type MysteryShopperQuestion,
} from "@/lib/mystery-shopper/questions";
import { submitMysteryShopperEvaluation } from "@/app/mystery-shopper/actions";

const MAX_IMAGES_PER_QUESTION = 3;

type AnswerState = {
  answer: boolean | null;
  note: string;
  images: File[];
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function initialAnswers(): Record<number, AnswerState> {
  const state: Record<number, AnswerState> = {};
  for (const q of MYSTERY_SHOPPER_QUESTIONS) {
    state[q.number] = { answer: null, note: "", images: [] };
  }
  return state;
}

export function MysteryShopperForm() {
  const [branchName, setBranchName] = useState("");
  const [evaluationDate, setEvaluationDate] = useState(todayISO());
  const [evaluatorName, setEvaluatorName] = useState("");
  const [evaluationTime, setEvaluationTime] = useState("");
  const [comment, setComment] = useState("");
  const [answers, setAnswers] = useState<Record<number, AnswerState>>(initialAnswers);
  const [hasOutdoorAndRestroom, setHasOutdoorAndRestroom] = useState(true);

  const [isSubmitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ totalScore: number; maxScore: number } | null>(null);

  const sections = useMemo(() => questionsBySection(hasOutdoorAndRestroom), [hasOutdoorAndRestroom]);
  const maxScore = useMemo(() => getMaxScoreFor(hasOutdoorAndRestroom), [hasOutdoorAndRestroom]);
  const applicableNumbers = useMemo(
    () => new Set(sections.flatMap((s) => s.questions.map((q) => q.number))),
    [sections]
  );

  const currentScore = useMemo(() => {
    let sum = 0;
    for (const section of sections) {
      for (const q of section.questions) {
        const a = answers[q.number];
        if (a?.answer !== null && a?.answer !== undefined) {
          sum += calculateQuestionScore(q, a.answer);
        }
      }
    }
    return sum;
  }, [answers, sections]);

  const answeredCount = Object.entries(answers).filter(
    ([num, a]) => applicableNumbers.has(Number(num)) && a.answer !== null
  ).length;
  const totalQuestions = applicableNumbers.size;

  function setAnswer(questionNumber: number, patch: Partial<AnswerState>) {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: { ...prev[questionNumber], ...patch },
    }));
  }

  function handleImagesChange(questionNumber: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    const current = answers[questionNumber].images;
    const incoming = Array.from(files).slice(0, MAX_IMAGES_PER_QUESTION - current.length);
    setAnswer(questionNumber, { images: [...current, ...incoming] });
  }

  function removeImage(questionNumber: number, index: number) {
    const current = answers[questionNumber].images;
    setAnswer(questionNumber, { images: current.filter((_, i) => i !== index) });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!branchName.trim()) {
      setError("Салбарын нэрийг оруулна уу.");
      return;
    }
    if (!evaluatorName.trim()) {
      setError("Үнэлэгчийн нэрийг оруулна уу.");
      return;
    }
    const unanswered = Object.entries(answers).find(
      ([num, a]) => applicableNumbers.has(Number(num)) && a.answer === null
    );
    if (unanswered) {
      setError(`${unanswered[0]}-р асуултад хариулна уу.`);
      return;
    }

    const formData = new FormData();
    formData.set("branchName", branchName.trim());
    formData.set("evaluationDate", evaluationDate);
    formData.set("evaluatorName", evaluatorName.trim());
    formData.set("evaluationTime", evaluationTime.trim());
    formData.set("comment", comment.trim());
    formData.set("hasOutdoorAndRestroom", String(hasOutdoorAndRestroom));

    const applicableEntries = Object.entries(answers).filter(([num]) => applicableNumbers.has(Number(num)));
    const answersPayload = applicableEntries.map(([questionNumber, a]) => ({
      questionNumber: Number(questionNumber),
      answer: a.answer,
      note: a.note,
    }));
    formData.set("answers", JSON.stringify(answersPayload));

    for (const [questionNumber, a] of applicableEntries) {
      a.images.forEach((file, i) => {
        formData.set(`image_q${questionNumber}_${i}`, file);
      });
    }

    startSubmitting(async () => {
      const res = await submitMysteryShopperEvaluation(formData);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setResult({ totalScore: res.totalScore, maxScore: res.maxScore });
    });
  }

  if (result) {
    const percent = Math.round((result.totalScore / result.maxScore) * 100);
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-ink/10 bg-white p-8 text-center">
        <p className="text-sm font-medium text-accent">Амжилттай хадгалагдлаа</p>
        <p className="mt-2 font-display text-3xl font-semibold text-ink">
          {result.totalScore}/{result.maxScore}
        </p>
        <p className="mt-1 text-ink/60">{percent}%</p>
        <p className="mt-6 text-sm text-ink/60">{branchName} · {evaluationDate}</p>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setBranchName("");
            setEvaluatorName("");
            setEvaluationTime("");
            setComment("");
            setEvaluationDate(todayISO());
            setAnswers(initialAnswers());
          }}
          className="focus-ring mt-6 rounded-md bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          Шинэ үнэлгээ эхлүүлэх
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pb-28">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          Нууц үйлчлүүлэгч
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Үйлчилгээний үнэлгээ
        </h1>
        <p className="mt-1 text-sm text-ink/60">Асуулт тус бүрд оноо өгч, шаардлагатай бол зураг хавсаргаарай</p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 rounded-lg border border-ink/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-ink">Салбар</label>
          <input
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="Салбарын нэр"
            required
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Огноо</label>
          <input
            type="date"
            value={evaluationDate}
            onChange={(e) => setEvaluationDate(e.target.value)}
            required
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Үнэлэгч</label>
          <input
            value={evaluatorName}
            onChange={(e) => setEvaluatorName(e.target.value)}
            placeholder="Нэр"
            required
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Цаг</label>
          <input
            value={evaluationTime}
            onChange={(e) => setEvaluationTime(e.target.value)}
            placeholder="Жишээ: 13:00"
            className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-ink/10 bg-white p-4">
        <label className="block text-sm font-medium text-ink">Салбарын төрөл</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="branchType"
              checked={hasOutdoorAndRestroom}
              onChange={() => setHasOutdoorAndRestroom(true)}
            />
            Бүрэн салбар (гадна талбай + ариун цэврийн өрөөтэй)
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="branchType"
              checked={!hasOutdoorAndRestroom}
              onChange={() => setHasOutdoorAndRestroom(false)}
            />
            Гадна талбай эсвэл ариун цэврийн өрөөгүй салбар
          </label>
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.section}>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">{section.section}</h2>
            <div className="space-y-4">
              {section.questions.map((q) => (
                <QuestionCard
                  key={q.number}
                  question={q}
                  state={answers[q.number]}
                  onAnswer={(value) => setAnswer(q.number, { answer: value })}
                  onNoteChange={(note) => setAnswer(q.number, { note })}
                  onImagesChange={(files) => handleImagesChange(q.number, files)}
                  onRemoveImage={(i) => removeImage(q.number, i)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <label className="block text-sm font-medium text-ink">📝 Нэмэлт мэдээлэл / коммент</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Үнэлгээний талаар бичих нэмэлт зүйл, ерөнхий тэмдэглэл, санал хүсэлт..."
          rows={4}
          className="focus-ring mt-1 w-full rounded-md border border-ink/15 px-3 py-2"
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 border-t border-ink/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs text-ink/50">
              Хариулсан: {answeredCount}/{totalQuestions}
            </p>
            <p className="font-display text-xl font-semibold text-ink">
              {currentScore}/{maxScore}
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring rounded-md bg-brand-500 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting ? "Хадгалж байна..." : "☁️ Системд хадгалах"}
          </button>
        </div>
      </div>
    </form>
  );
}

function QuestionCard({
  question,
  state,
  onAnswer,
  onNoteChange,
  onImagesChange,
  onRemoveImage,
}: {
  question: MysteryShopperQuestion;
  state: AnswerState;
  onAnswer: (value: boolean) => void;
  onNoteChange: (note: string) => void;
  onImagesChange: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
}) {
  const positiveLabel = question.inverted ? "Үгүй" : "Тийм";

  const previewUrls = useMemo(() => state.images.map((file) => URL.createObjectURL(file)), [state.images]);
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-ink">
          {question.number}. {question.text}
        </p>
        <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/60">
          {question.maxScore} оноо
        </span>
      </div>
      {question.note && <p className="mt-1 text-xs text-ink/50">({question.note})</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className={`focus-ring rounded-md px-4 py-1.5 text-sm font-medium ${
            state.answer === true
              ? "bg-brand-500 text-white"
              : "border border-ink/15 text-ink hover:border-ink/30"
          }`}
        >
          Тийм
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className={`focus-ring rounded-md px-4 py-1.5 text-sm font-medium ${
            state.answer === false
              ? "bg-brand-500 text-white"
              : "border border-ink/15 text-ink hover:border-ink/30"
          }`}
        >
          Үгүй
        </button>
        <span className="ml-2 text-xs text-ink/40">
          {positiveLabel} = {question.maxScore} оноо
        </span>
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium text-ink/60">
          Зураг хавсаргах (дээд тал {MAX_IMAGES_PER_QUESTION})
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {state.images.map((file, i) => (
            <div key={i} className="relative">
              <img
                src={previewUrls[i]}
                alt=""
                className="h-16 w-16 rounded-md border border-ink/10 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                className="focus-ring absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-white"
                aria-label="Зураг хасах"
              >
                ×
              </button>
            </div>
          ))}
          {state.images.length < MAX_IMAGES_PER_QUESTION && (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-ink/20 text-xs text-ink/40 hover:border-ink/40">
              +
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  onImagesChange(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      <input
        value={state.note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Тэмдэглэл / тайлбар (заавал биш)"
        className="focus-ring mt-3 w-full rounded-md border border-ink/15 px-3 py-2 text-sm"
      />
    </div>
  );
}
