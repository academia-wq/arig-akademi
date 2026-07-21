"use client";

export function DeleteButton({ confirmText }: { confirmText: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="focus-ring rounded-md border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:border-red-400 hover:bg-red-50"
    >
      Устгах
    </button>
  );
}
