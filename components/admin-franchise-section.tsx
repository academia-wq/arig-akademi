"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createFranchise, updateFranchise } from "@/app/(app)/admin/actions";
import { useConfirm } from "@/components/confirm-dialog";
import { PlusIcon } from "@/components/icons";

type Franchise = {
  id: string;
  name: string;
  invite_code: string;
  is_active: boolean;
  employeeCount: number;
};

// Админ самбарын "Франчайз" таб: франчайз нэмэх, бүртгэлийн холбоос хуулах,
// идэвхгүй болгох, кодыг шинэчлэх.
export function AdminFranchiseSection({ franchises }: { franchises: Franchise[] }) {
  const router = useRouter();
  const [confirm, confirmDialog] = useConfirm();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linkFor = (code: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/register?code=${code}`;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError(null);
    const formData = new FormData();
    formData.set("name", name.trim());
    const result = await createFranchise(formData);
    setAdding(false);
    if (result.success) {
      setName("");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function copy(f: Franchise) {
    try {
      await navigator.clipboard.writeText(linkFor(f.invite_code));
      setCopiedId(f.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  async function run(f: Franchise, patch: Parameters<typeof updateFranchise>[1]) {
    setBusyId(f.id);
    setError(null);
    const result = await updateFranchise(f.id, patch);
    setBusyId(null);
    if (result.success) router.refresh();
    else setError(result.error);
  }

  async function toggleActive(f: Franchise) {
    if (f.is_active) {
      const ok = await confirm({
        title: "Франчайзыг идэвхгүй болгох уу?",
        message: `"${f.name}"-ийн бүртгэлийн холбоос ажиллахаа больно. Одоо байгаа ажилтнууд нь сургалтаа үргэлжлүүлэн үзнэ.`,
        confirmLabel: "Идэвхгүй болгох",
        tone: "danger",
      });
      if (!ok) return;
    }
    await run(f, { is_active: !f.is_active });
  }

  async function regenerate(f: Franchise) {
    const ok = await confirm({
      title: "Шинэ код үүсгэх үү?",
      message: `"${f.name}"-ийн хуучин бүртгэлийн холбоос ажиллахаа больж, шинэ холбоос үүснэ.`,
      confirmLabel: "Шинэ код",
    });
    if (!ok) return;
    await run(f, { regenerateCode: true });
  }

  return (
    <div className="flex flex-col gap-5">
      {confirmDialog}

      <div className="rounded-xl border border-ink/15 bg-white p-5">
        <p className="font-medium text-ink">Франчайз нэмэх</p>
        <p className="mt-1 text-sm text-ink/50">
          Франчайз бүр өөрийн бүртгэлийн холбоостой. Тэр холбоосоор бүртгүүлсэн хүн тухайн
          франчайзын ажилтан болж, зөвхөн "Франчайз" ба "Хоёулаа" гэсэн сургалтуудыг харна.
        </p>
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Жишээ: Ариг Аня — Дархан салбар"
            className="focus-ring w-full min-w-0 rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="focus-ring flex flex-shrink-0 items-center gap-2 rounded-md bg-brand-500 px-5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] hover:bg-brand-700 disabled:opacity-60"
          >
            {adding ? "Нэмж байна..." : "Нэмэх"}
            {!adding && <PlusIcon className="h-3.5 w-3.5" />}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink/15 bg-white">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="bg-brand-500 text-xs uppercase text-white">
              <th className="px-4 py-3 font-medium">Франчайз</th>
              <th className="px-4 py-3 text-center font-medium">Ажилтан</th>
              <th className="px-4 py-3 font-medium">Бүртгэлийн холбоос</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {franchises.map((f) => (
              <tr
                key={f.id}
                className={clsx("border-b border-ink/10 last:border-0", !f.is_active && "opacity-60")}
              >
                <td className="px-4 py-4 text-sm font-medium text-ink">
                  {f.name}
                  {!f.is_active && (
                    <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink/60">
                      Идэвхгүй
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-center text-sm text-[#8A9DA2]">{f.employeeCount}</td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-paper px-2 py-1 text-xs text-ink/70">
                      /register?code={f.invite_code}
                    </code>
                    <button
                      type="button"
                      disabled={!f.is_active}
                      onClick={() => copy(f)}
                      className="focus-ring rounded-md border border-ink/15 px-3 py-1 text-xs font-medium text-ink hover:border-brand-300 disabled:cursor-not-allowed"
                    >
                      {copiedId === f.id ? "Хуулсан" : "Хуулах"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-xs">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={busyId === f.id}
                      onClick={() => regenerate(f)}
                      className="focus-ring font-medium text-ink/50 hover:text-brand-500"
                    >
                      Шинэ код
                    </button>
                    <button
                      type="button"
                      disabled={busyId === f.id}
                      onClick={() => toggleActive(f)}
                      className="focus-ring font-medium text-ink/50 hover:text-brand-500"
                    >
                      {f.is_active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {franchises.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink/50">
                  Франчайз бүртгэгдээгүй байна.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
