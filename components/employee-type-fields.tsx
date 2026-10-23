"use client";

export type FranchiseOption = { id: string; name: string };
export type EmployeeType = "core" | "franchise";

// "Ажилтан нэмэх", "Ажилтан засах" цонхонд: Үндсэн / Франчайз сонголт,
// франчайз бол аль франчайзынх болохыг сонгоно.
export function EmployeeTypeFields({
  franchises,
  employeeType,
  franchiseId,
  onChange,
}: {
  franchises: FranchiseOption[];
  employeeType: EmployeeType;
  franchiseId: string;
  onChange: (type: EmployeeType, franchiseId: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">Ажилтны төрөл</label>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {(
          [
            ["core", "Үндсэн"],
            ["franchise", "Франчайз"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value, value === "franchise" ? franchiseId || franchises[0]?.id || "" : "")}
            className={`focus-ring rounded-md border px-2 py-1.5 text-sm font-medium transition ${
              employeeType === value
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {employeeType === "franchise" &&
        (franchises.length === 0 ? (
          <p className="mt-2 text-xs text-red-600">
            Франчайз бүртгэгдээгүй байна. Эхлээд "Франчайз" табаас франчайз нэмнэ үү.
          </p>
        ) : (
          <select
            value={franchiseId}
            onChange={(e) => onChange("franchise", e.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
          >
            {franchises.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        ))}
    </div>
  );
}
