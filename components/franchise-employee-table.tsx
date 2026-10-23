"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { EditIcon, SearchIcon, XIcon } from "@/components/icons";
import { Tooltip } from "@/components/tooltip";
import { useConfirm } from "@/components/confirm-dialog";
import { initialsOf } from "@/lib/format";
import { DEPARTMENTS, POSITIONS } from "@/lib/departments";
import { setFranchiseEmployeeActive, updateFranchiseEmployee } from "@/app/(app)/franchise/actions";

export type FranchiseEmployee = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  department: string | null;
  position: string | null;
  isManager: boolean;
  isActive: boolean;
  totalLessons: number;
  completedLessons: number;
  lastActivity: string | null;
};

function percent(e: FranchiseEmployee) {
  return e.totalLessons ? Math.round((e.completedLessons / e.totalLessons) * 100) : 0;
}

export function FranchiseEmployeeTable({ employees }: { employees: FranchiseEmployee[] }) {
  const router = useRouter();
  const [confirm, confirmDialog] = useConfirm();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FranchiseEmployee | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.email, e.department, e.position].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [employees, query]);

  async function toggleActive(e: FranchiseEmployee) {
    const ok = await confirm(
      e.isActive
        ? {
            title: "Ажилтныг идэвхгүй болгох уу?",
            message: `${e.name} нэвтэрч чадахгүй болно. Сургалтын явц нь хадгалагдана, хүссэн үедээ буцааж идэвхжүүлж болно.`,
            confirmLabel: "Идэвхгүй болгох",
            tone: "danger",
          }
        : {
            title: "Ажилтныг идэвхжүүлэх үү?",
            message: `${e.name} дахин нэвтэрч сургалтаа үргэлжлүүлэх боломжтой болно.`,
            confirmLabel: "Идэвхжүүлэх",
          }
    );
    if (!ok) return;
    setBusyId(e.id);
    const result = await setFranchiseEmployeeActive(e.id, !e.isActive);
    setBusyId(null);
    if (result.success) router.refresh();
    else
      await confirm({ title: "Амжилтгүй", message: result.error, confirmLabel: "Ойлголоо", showCancel: false });
  }

  return (
    <div className="rounded-xl border border-ink/15 bg-white p-5">
      {confirmDialog}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[319px]">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9DA2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ажилтан хайх..."
            className="focus-ring h-[39px] w-full rounded-[7.5px] border border-[#D9D9D9] bg-paper pl-10 pr-3 text-sm text-ink placeholder:text-[#8A9DA2]"
          />
        </div>
        <p className="text-sm text-[#8A9DA2] sm:ml-auto">{visible.length} ажилтан</p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-brand-500 text-xs uppercase text-white">
              <th className="px-4 py-3 font-medium">Ажилтан</th>
              <th className="px-4 py-3 text-center font-medium">Хэлтэс</th>
              <th className="px-4 py-3 text-center font-medium">Албан тушаал</th>
              <th className="px-4 py-3 font-medium">Явц</th>
              <th className="px-4 py-3 text-center font-medium">Сүүлд</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr
                key={e.id}
                className={clsx("border-b border-ink/10 last:border-0", !e.isActive && "opacity-50")}
              >
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-brand-50 font-display text-xs font-semibold text-brand-700">
                      {e.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initialsOf(e.name, e.email)
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {e.name}
                        {e.isManager && (
                          <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                            Менежер
                          </span>
                        )}
                        {!e.isActive && (
                          <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink/60">
                            Идэвхгүй
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-[#8A9DA2]">{e.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-sm text-[#8A9DA2]">{e.department || "—"}</td>
                <td className="px-4 py-4 text-center text-sm text-[#8A9DA2]">
                  {e.position || <span className="text-brand-500">Оноогоогүй</span>}
                </td>
                <td className="px-4 py-4 text-sm">
                  {e.isManager ? (
                    <span className="text-[#8A9DA2]">—</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-ink/10">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent(e)}%` }} />
                      </div>
                      <span className="text-xs text-ink/60">
                        {percent(e)}% · {e.completedLessons}/{e.totalLessons}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-center text-xs text-[#8A9DA2]">
                  {e.lastActivity ? new Date(e.lastActivity).toLocaleDateString("mn-MN") : "—"}
                </td>
                <td className="px-4 py-4 text-right">
                  {!e.isManager && (
                    <div className="flex items-center justify-end gap-3">
                      <Tooltip label="Засах">
                        <button
                          type="button"
                          onClick={() => setEditing(e)}
                          aria-label="Засах"
                          className="focus-ring inline-flex text-ink/40 hover:text-brand-500"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <button
                        type="button"
                        disabled={busyId === e.id}
                        onClick={() => toggleActive(e)}
                        className="focus-ring text-xs font-medium text-ink/50 hover:text-brand-500"
                      >
                        {e.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink/50">
                  {employees.length === 0
                    ? "Одоогоор ажилтан бүртгүүлээгүй байна. Бүртгэлийн холбоосыг ажилтнууддаа илгээнэ үү."
                    : "Хайлтад тохирох ажилтан алга."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditFranchiseEmployeeModal
          employee={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EditFranchiseEmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: FranchiseEmployee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialDepartment =
    employee.department && DEPARTMENTS.includes(employee.department) ? employee.department : DEPARTMENTS[0];
  const [department, setDepartment] = useState(initialDepartment);
  const [position, setPosition] = useState(
    employee.position && POSITIONS[initialDepartment].includes(employee.position)
      ? employee.position
      : POSITIONS[initialDepartment][0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.set("profileId", employee.id);
    formData.set("department", department);
    formData.set("position", position);
    const result = await updateFranchiseEmployee(formData);
    setSubmitting(false);
    if (result.success) onSaved();
    else setError(result.error);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <p className="text-lg text-ink">Ажилтан засах</p>
          <button
            type="button"
            onClick={onClose}
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
              {employee.name}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            {DEPARTMENTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDepartment(d);
                  setPosition(POSITIONS[d][0]);
                }}
                className={`focus-ring flex-auto whitespace-nowrap rounded-md border px-2 py-1.5 text-sm font-medium transition ${
                  department === d
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
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm text-ink"
            >
              {POSITIONS[department].map((p) => (
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
              onClick={onClose}
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
  );
}
