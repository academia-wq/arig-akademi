"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { SearchIcon } from "@/components/icons";
import { initialsOf } from "@/lib/format";
import { EditEmployeeButton } from "@/components/edit-employee-modal";

type Employee = {
  id: string;
  full_name: string | null;
  email: string;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
};

const MAX_ROWS = 10;

export function AdminEmployeeList({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string | null>(null);

  const departments = useMemo(
    () =>
      Array.from(new Set(employees.map((e) => e.department).filter(Boolean) as string[])).sort(),
    [employees]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (department && e.department !== department) return false;
      if (!q) return true;
      return [e.full_name, e.email, e.position, e.department].some((v) =>
        (v || "").toLowerCase().includes(q)
      );
    });
  }, [employees, query, department]);

  const visible = filtered.slice(0, MAX_ROWS);

  return (
    <div>
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

        <div className="flex flex-wrap items-center gap-2">
          {[null, ...departments].map((d) => (
            <button
              key={d ?? "all"}
              type="button"
              onClick={() => setDepartment(d)}
              className={clsx(
                "focus-ring h-[39px] rounded-[7.5px] px-5 text-sm font-medium transition",
                department === d
                  ? "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                  : "border border-[#D9D9D9] bg-paper text-[#8A9DA2] hover:border-ink/30"
              )}
            >
              {d ?? "Бүгд"}
            </button>
          ))}
        </div>

        <p className="text-sm text-[#8A9DA2] sm:ml-auto">{filtered.length} ажилтан</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
        <div className="flex items-center justify-between p-6 pb-0">
          <p className="text-ink">Нийт ажилтан</p>
          <Link
            prefetch={false}
            href="/admin/students"
            className="focus-ring text-sm font-medium text-brand-500"
          >
            Бүгдийг харах
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto px-4 pb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-500 text-xs uppercase text-paper">
                <th className="px-4 py-3 font-medium">Ажилтны нэр</th>
                <th className="px-4 py-3 text-center font-medium">Имэйл</th>
                <th className="px-4 py-3 text-center font-medium">Албан тушаал</th>
                <th className="px-4 py-3 text-center font-medium">Хэлтэс</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-b border-ink/10 last:border-0">
                  <td className="px-4 py-4 text-sm font-medium text-ink">
                    <Link
                      prefetch={false}
                      href={`/admin/students/${p.id}`}
                      className="focus-ring flex items-center gap-4 hover:text-brand-500"
                    >
                      <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-brand-50 font-display text-sm font-semibold text-brand-700">
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initialsOf(p.full_name, p.email)
                        )}
                      </span>
                      {p.full_name || "Нэргүй"}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-[#8A9DA2]">{p.email}</td>
                  <td className="px-4 py-4 text-center text-sm text-[#8A9DA2]">
                    {p.position || "—"}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-[#8A9DA2]">
                    {p.department || "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <EditEmployeeButton
                      profileId={p.id}
                      name={p.full_name || p.email}
                      department={p.department}
                      position={p.position}
                    />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/50">
                    Ажилтан олдсонгүй.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
