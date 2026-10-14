"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setUserActive,
  deleteUserPermanently,
} from "@/app/(admin)/admin/students/actions";
import { ConfirmDialog, type ConfirmOptions } from "@/components/confirm-dialog";

type ActionResult = { success: true } | { success: false; error: string };

export function StudentRowActions({
  userId,
  name,
  email,
  active,
  canDelete,
}: {
  userId: string;
  name: string;
  email: string;
  active: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{
    options: ConfirmOptions;
    action: () => Promise<ActionResult>;
  } | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.success) router.refresh();
      else setError(result.error);
    });
  }

  function toggleActive() {
    setConfirming({
      options: active
        ? {
            title: "Идэвхгүй болгох уу?",
            message: `"${name}" нэвтэрч чадахгүй болно.\n\nСургалтын явц, гэрчилгээ зэрэг бүх мэдээлэл нь хадгалагдах бөгөөд дараа нь буцааж идэвхжүүлж болно.`,
            confirmLabel: "Идэвхгүй болгох",
          }
        : {
            title: "Дахин идэвхжүүлэх үү?",
            message: `"${name}" дахин нэвтэрч чадна.`,
            confirmLabel: "Идэвхжүүлэх",
          },
      action: () => setUserActive(userId, !active),
    });
  }

  function deletePermanently() {
    setConfirming({
      options: {
        title: "Бүрмөсөн устгах уу?",
        message: `"${name}" (${email})-ийн нэвтрэх бүртгэл, профайл, сургалтын явц, элсэлт, мэдэгдлүүд бүгд устана. Энэ үйлдлийг БУЦААХ БОЛОМЖГҮЙ.\n\nЗүгээр л нэвтрэхийг хаах бол "Идэвхгүй болгох"-ыг ашиглана уу.`,
        confirmLabel: "Бүрмөсөн устгах",
        tone: "danger",
      },
      action: () => deleteUserPermanently(userId),
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className={
            active
              ? "focus-ring whitespace-nowrap rounded-md border border-ink/15 px-3 py-1 text-sm font-medium text-ink/70 hover:border-ink/30 hover:bg-ink/5 disabled:opacity-50"
              : "focus-ring whitespace-nowrap rounded-md border border-accent/40 px-3 py-1 text-sm font-medium text-accent hover:border-accent hover:bg-accent/5 disabled:opacity-50"
          }
        >
          {active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={deletePermanently}
            disabled={pending}
            className="focus-ring whitespace-nowrap rounded-md border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
          >
            Устгах
          </button>
        )}
      </div>
      {pending && <p className="text-xs text-ink/50">Хадгалж байна...</p>}
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}

      {confirming && (
        <ConfirmDialog
          options={confirming.options}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const { action } = confirming;
            setConfirming(null);
            run(action);
          }}
        />
      )}
    </div>
  );
}
