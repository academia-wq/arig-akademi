"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  XIcon,
  PlusIcon,
  ChevronDownIcon,
  VideoIcon,
  ImageIcon,
  CloudUploadIcon,
} from "@/components/icons";
import { createModuleWithLesson, uploadLessonMaterial } from "@/app/(app)/admin/actions";
import { uploadLessonImage } from "@/app/(admin)/admin/courses/[id]/edit/actions";
import { uploadVideoToMux, waitForMuxVideo } from "@/lib/mux-upload";

export const CATEGORIES = [
  "Менежмент",
  "Санхүү",
  "Технологи",
  "Гал тогоо",
  "Харилцагчийн үйлчилгээ",
  "Аюулгүй байдал",
];

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
// Зураг, PDF нь server action-оор дамждаг; Vercel нэг хүсэлтийг ~4.5MB-аар хязгаарладаг.
const MAX_SMALL_FILE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const inputClass =
  "focus-ring w-full rounded-md border border-[#D9D9D9] bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-[#8A9DA2]";
const labelClass = "block text-sm text-ink";

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

// Дарж сонгох эсвэл чирж оруулах талбар.
function Dropzone({
  accept,
  multiple,
  onFiles,
  disabled,
  layout,
  icon,
  title,
  hint,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  layout: "stacked" | "inline";
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={clsx(
        "focus-ring flex w-full rounded-md border border-dashed transition disabled:opacity-50",
        dragging ? "border-brand-500 bg-brand-50" : "border-[#D9D9D9] hover:border-brand-300 hover:bg-brand-50/40",
        layout === "stacked"
          ? "flex-col items-center justify-center gap-1.5 px-4 py-6 text-center"
          : "items-center gap-3 px-3 py-3 text-left"
      )}
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-ink/10 text-ink/60">
        {icon}
      </span>
      <span className={clsx("min-w-0", layout === "stacked" && "mt-1")}>
        <span className="block text-sm text-ink">{title}</span>
        <span className={clsx("block text-[#8A9DA2]", layout === "inline" ? "text-[11px]" : "text-xs")}>{hint}</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </button>
  );
}

function FileChips({
  files,
  onRemove,
  disabled,
}: {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          className="flex items-center gap-2 rounded-md bg-paper px-2.5 py-1.5 text-xs text-ink"
        >
          <span className="min-w-0 flex-1 truncate">{f.name}</span>
          <span className="flex-shrink-0 text-[#8A9DA2]">{formatSize(f.size)}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(i)}
            aria-label={`${f.name} хасах`}
            className="focus-ring flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-ink/40 hover:bg-ink/5 hover:text-ink disabled:opacity-40"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AddCourseButton({ courses }: { courses: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [addingNewCourse, setAddingNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [lessonCount, setLessonCount] = useState("");
  const [duration, setDuration] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [pdfs, setPdfs] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Сургалт үүссэн ч зарим файл хуулагдаагүй үед — дахин үүсгэхгүйн тулд хадгална.
  const [partial, setPartial] = useState(false);

  function reset() {
    setError(null);
    setProgress(null);
    setPartial(false);
    setCourseId("");
    setAddingNewCourse(false);
    setNewCourseTitle("");
    setModuleTitle("");
    setCategory(CATEGORIES[0]);
    setLessonCount("");
    setDuration("");
    setVideo(null);
    setImages([]);
    setPdfs([]);
  }

  function close() {
    if (submitting) return;
    setOpen(false);
    if (partial) router.refresh();
    reset();
  }

  function addVideo(files: File[]) {
    const f = files[0];
    if (!f.type.startsWith("video/")) return setError("Видео файл (MP4, MOV) сонгоно уу.");
    if (f.size > MAX_VIDEO_BYTES) return setError("Видео 2GB-аас хэтэрсэн байна.");
    setError(null);
    setVideo(f);
  }

  function addImages(files: File[]) {
    const bad = files.find((f) => !IMAGE_TYPES.includes(f.type));
    if (bad) return setError(`"${bad.name}" — зөвхөн JPEG, PNG, WEBP, GIF зураг.`);
    const big = files.find((f) => f.size > MAX_SMALL_FILE_BYTES);
    if (big) return setError(`"${big.name}" 4MB-аас том байна.`);
    setError(null);
    setImages((prev) => [...prev, ...files]);
  }

  function addPdfs(files: File[]) {
    const bad = files.find((f) => f.type !== "application/pdf");
    if (bad) return setError(`"${bad.name}" — зөвхөн PDF файл.`);
    const big = files.find((f) => f.size > MAX_SMALL_FILE_BYTES);
    if (big) return setError(`"${big.name}" 4MB-аас том байна.`);
    setError(null);
    setPdfs((prev) => [...prev, ...files]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return setError("Сургалтын нэрээ оруулна уу.");
    if (!addingNewCourse && !courseId) return setError("Бүлгээ сонгоно уу.");
    if (addingNewCourse && !newCourseTitle.trim()) return setError("Шинэ бүлгийн нэрээ оруулна уу.");
    const parsedCount = parseInt(lessonCount || "1", 10);
    const lessons = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 50) : 1;
    if (images.length > lessons) {
      return setError(
        `Зураг хичээл бүрт нэг нэгээр оноогдоно: ${lessons} хичээлд хамгийн ихдээ ${lessons} зураг.`
      );
    }

    setSubmitting(true);
    setError(null);

    // 1. Сургалт (модуль) болон хичээлүүдийг үүсгэнэ.
    setProgress("Сургалт үүсгэж байна...");
    const formData = new FormData();
    if (addingNewCourse) formData.set("newCourseTitle", newCourseTitle.trim());
    else formData.set("courseId", courseId);
    formData.set("moduleTitle", moduleTitle.trim());
    formData.set("category", category);
    formData.set("duration", duration);
    formData.set("lessonCount", String(lessons));

    const created = await createModuleWithLesson(formData);
    if (!created.success) {
      setSubmitting(false);
      setProgress(null);
      return setError(created.error);
    }
    setPartial(true);

    // 2. Файлуудыг хуулна. Нэг нь бүтэлгүйтсэн ч бусдыг үргэлжлүүлж, эцэст нь мэдэгдэнэ.
    const failures: string[] = [];

    if (video) {
      try {
        await uploadVideoToMux(created.lessonId, video, (p) =>
          setProgress(`Видео хуулж байна... ${p}%`)
        );
        // Mux encode хэдэн минут болно — цонхыг хүлээлгэхгүй, ар талд нь хичээлд холбоно.
        waitForMuxVideo(created.lessonId).then((ready) => ready && router.refresh());
      } catch (err: any) {
        failures.push(`Видео: ${err?.message || "алдаа"}`);
      }
    }

    for (let i = 0; i < images.length; i++) {
      setProgress(`Зураг хуулж байна... (${i + 1}/${images.length})`);
      const fd = new FormData();
      fd.set("file", images[i]);
      const r = await uploadLessonImage(created.lessonIds[i], created.courseId, fd);
      if (!r.success) failures.push(`${images[i].name}: ${r.error}`);
    }

    for (let i = 0; i < pdfs.length; i++) {
      setProgress(`PDF хуулж байна... (${i + 1}/${pdfs.length})`);
      const fd = new FormData();
      fd.set("file", pdfs[i]);
      const r = await uploadLessonMaterial(created.lessonId, created.courseId, fd);
      if (!r.success) failures.push(`${pdfs[i].name}: ${r.error}`);
    }

    setSubmitting(false);
    setProgress(null);

    if (failures.length) {
      setError(
        `Сургалт үүссэн ч дараах файлууд хуулагдсангүй (сургалт засах хэсгээс дахин нэмж болно):\n${failures.join("\n")}`
      );
      return;
    }

    setOpen(false);
    reset();
    router.refresh();
  }

  const busy = submitting || partial;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700"
      >
        Сургалт нэмэх
        <PlusIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 text-left shadow-xl sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-[#D9D9D9] pb-4">
              <p className="text-lg text-ink">Сургалт нэмэх</p>
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                aria-label="Хаах"
                className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-brand-500 text-brand-500 hover:bg-brand-50 disabled:opacity-50"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <fieldset disabled={busy} className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Бүлэг</label>
                  <div className="mt-1.5 flex gap-2">
                    {!addingNewCourse ? (
                      <div className="relative w-full">
                        <select
                          value={courseId}
                          onChange={(e) => setCourseId(e.target.value)}
                          className={clsx(inputClass, "appearance-none pr-10")}
                        >
                          <option value="">Сонгоно уу</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
                      </div>
                    ) : (
                      <input
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Шинэ бүлгийн нэр"
                        className={inputClass}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAddingNewCourse((v) => !v);
                        setCourseId("");
                        setNewCourseTitle("");
                      }}
                      aria-label={addingNewCourse ? "Байгаа бүлэг сонгох" : "Шинэ бүлэг нэмэх"}
                      className="focus-ring flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-md bg-brand-500 text-white hover:bg-brand-700"
                    >
                      {addingNewCourse ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Сургалтын нэр</label>
                  <input
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="Жишээ: Үйлчилгээний стандарт"
                    className={clsx(inputClass, "mt-1.5")}
                  />
                </div>

                <div>
                  <label className={labelClass}>Ангилал</label>
                  <div className="relative mt-1.5">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={clsx(inputClass, "appearance-none pr-10")}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Хичээлийн тоо</label>
                    <input
                      value={lessonCount}
                      onChange={(e) => setLessonCount(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="10"
                      className={clsx(inputClass, "mt-1.5")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Нийт хугацаа</label>
                    <input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="15 цаг"
                      className={clsx(inputClass, "mt-1.5")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Видео файл (MP4, MOV — макс 2GB)</label>
                  <div className="mt-1.5">
                    <Dropzone
                      accept="video/mp4,video/quicktime,video/*"
                      onFiles={addVideo}
                      layout="stacked"
                      icon={<VideoIcon className="h-5 w-5" />}
                      title={video ? "Өөр видео сонгох" : "Видео сонгох"}
                      hint="Эсвэл энд чирж оруулна уу"
                    />
                    <FileChips files={video ? [video] : []} onRemove={() => setVideo(null)} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={clsx(labelClass, "sm:whitespace-nowrap sm:text-xs")}>Зураг оруулах (олон файл оруулж болно)</label>
                    <div className="mt-1.5">
                      <Dropzone
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onFiles={addImages}
                        layout="inline"
                        icon={<ImageIcon className="h-5 w-5" />}
                        title="Зураг оруулах"
                        hint="чирж оруулах эсвэл дарж сонгоно уу"
                      />
                      <FileChips
                        files={images}
                        onRemove={(i) => setImages((prev) => prev.filter((_, j) => j !== i))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={clsx(labelClass, "sm:whitespace-nowrap sm:text-xs")}>PDF Материал (олон файл оруулж болно)</label>
                    <div className="mt-1.5">
                      <Dropzone
                        accept="application/pdf"
                        multiple
                        onFiles={addPdfs}
                        layout="inline"
                        icon={<CloudUploadIcon className="h-5 w-5" />}
                        title="PDF файл нэмэх"
                        hint="чирж оруулах эсвэл дарж сонгоно уу"
                      />
                      <FileChips
                        files={pdfs}
                        onRemove={(i) => setPdfs((prev) => prev.filter((_, j) => j !== i))}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              {progress && <p className="text-sm text-brand-500">{progress}</p>}
              {error && <p className="whitespace-pre-line text-sm text-red-600">{error}</p>}

              <div className="mt-1 flex gap-3">
                {partial ? (
                  <button
                    type="button"
                    onClick={close}
                    disabled={submitting}
                    className="focus-ring flex-1 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {submitting ? "Хуулж байна..." : "Хаах"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={close}
                      disabled={submitting}
                      className="focus-ring flex-1 rounded-md border border-[#D9D9D9] px-4 py-2.5 text-sm font-medium text-[#8A9DA2] transition hover:border-ink/30 hover:text-ink disabled:opacity-50"
                    >
                      Болих
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="focus-ring flex-1 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700 disabled:opacity-60"
                    >
                      {submitting ? "Нэмж байна..." : "Нэмэх"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
