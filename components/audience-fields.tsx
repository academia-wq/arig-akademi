"use client";

import { AUDIENCES, type Audience } from "@/lib/module-visibility";

// "Сургалт нэмэх", "Сургалт засах" цонхонд: сургалт хэнд зориулсан.
export function AudienceFields({
  value,
  onChange,
}: {
  value: Audience;
  onChange: (value: Audience) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">Хэнд зориулсан</label>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {AUDIENCES.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => onChange(a.value)}
            className={`focus-ring rounded-md border px-2 py-1.5 text-sm font-medium transition ${
              value === a.value
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink/50">
        {value === "core"
          ? "Зөвхөн үндсэн ажилтнуудад харагдана."
          : value === "franchise"
          ? "Зөвхөн франчайзын ажилтнуудад харагдана."
          : "Үндсэн болон франчайзын ажилтнуудад харагдана."}
      </p>
    </div>
  );
}
