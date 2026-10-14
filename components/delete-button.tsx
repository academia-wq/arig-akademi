"use client";

import { useConfirm } from "@/components/confirm-dialog";

// <form action={...}> дотор байрлана: баталгаажуулсны дараа тухайн form-ыг илгээнэ.
export function DeleteButton({
  confirmText,
  title = "Устгах уу?",
}: {
  confirmText: string;
  title?: string;
}) {
  const [confirm, confirmDialog] = useConfirm();

  return (
    <>
      <button
        type="button"
        onClick={async (e) => {
          const form = e.currentTarget.form;
          const ok = await confirm({
            title,
            message: confirmText,
            confirmLabel: "Устгах",
            tone: "danger",
          });
          if (ok) form?.requestSubmit();
        }}
        className="focus-ring rounded-md border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:border-red-400 hover:bg-red-50"
      >
        Устгах
      </button>
      {confirmDialog}
    </>
  );
}
