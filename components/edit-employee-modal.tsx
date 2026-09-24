"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon, EditIcon } from "@/components/icons";
import { assignEmployee } from "@/app/(app)/admin/actions";
import { DEPARTMENTS, POSITIONS } from "@/components/add-employee-modal";

export function EditEmployeeButton({
  profileId,
  name,
  department,
  position,
}: {
  profileId: string;
  name: string;
  department: string | null;
  position: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initialDepartment = department && DEPARTMENTS.includes(department) ? department : DEPARTMENTS[0];
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment);
  const [selectedPosition, setSelectedPosition] = useState(position || POSITIONS[initialDepartment][0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positionOptions = POSITIONS[selectedDepartment].includes(selectedPosition)
    ? POSITIONS[selectedDepartment]
    : [selectedPosition, ...POSITIONS[selectedDepartment]];

  function close() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("profileId", profileId);
    formData.set("department", selectedDepartment);
    formData.set("position", selectedPosition);

    const result = await assignEmployee(formData);
    setSubmitting(false);
    if (result.success) {
      close();
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Засах"
        className="focus-ring inline-flex text-ink/40 hover:text-brand-500"
      >
        <EditIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <p className="text-lg text-ink">Ажилтан засах</p>
              <button
                type="button"
                onClick={close}
                aria-label="Хаах"
                className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-500 text-brand-500 hover:bg-brand-50"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-ink">Ажилтан</label>
                <p className="mt-1.5 rounded-md border border-ink/10 bg-paper px-3 py-2.5 text-sm text-ink">
                  {name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDepartment(d);
                      setSelectedPosition(POSITIONS[d][0]);
                    }}
                    className={`focus-ring rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                      selectedDepartment === d
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-ink/15 text-ink/60 hover:border-ink/30"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink">Албан тушаал</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
                >
                  {positionOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="focus-ring flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="focus-ring flex-1 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0px_0px_2px_rgba(248,123,79,0.5)] transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
