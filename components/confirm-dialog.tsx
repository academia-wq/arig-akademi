"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "brand" | "danger";
  // false бол "Болих" товчгүй — зөвхөн мэдээлэл харуулна (alert()-ийн оронд).
  showCancel?: boolean;
};

// const [confirm, confirmDialog] = useConfirm();
// if (!(await confirm({...}))) return;   ...JSX дотор {confirmDialog} байрлуулна.
export function useConfirm() {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setState({ options, resolve })),
    []
  );

  const close = useCallback(
    (ok: boolean) => {
      state?.resolve(ok);
      setState(null);
    },
    [state]
  );

  const dialog = state ? (
    <ConfirmDialog
      options={state.options}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return [confirm, dialog] as const;
}

// Хөтчийн confirm()-ийн оронд дэлгэцийн голд гарах баталгаажуулах цонх.
export function ConfirmDialog({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-xl"
      >
        <p id="confirm-dialog-title" className="text-lg text-ink">
          {options.title}
        </p>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink/70">{options.message}</p>
        <div className="mt-6 flex gap-3">
          {options.showCancel !== false && (
            <button
              type="button"
              onClick={onCancel}
              className="focus-ring flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30 hover:bg-ink/5"
            >
              Болих
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={clsx(
              "focus-ring flex-1 rounded-md px-4 py-2.5 text-sm font-medium text-white transition",
              options.tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand-500 shadow-[0px_0px_2px_rgba(248,123,79,0.5)] hover:bg-brand-700"
            )}
          >
            {options.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
