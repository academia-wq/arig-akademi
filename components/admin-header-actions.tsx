"use client";

import type { ReactNode } from "react";
import { useAdminActiveTab } from "@/components/admin-active-tab-context";
import { DownloadIcon } from "@/components/icons";

export function AdminHeaderActions({
  addEmployeeButton,
  addCourseButton,
}: {
  addEmployeeButton: ReactNode;
  addCourseButton: ReactNode;
}) {
  const { active } = useAdminActiveTab();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="focus-ring flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
      >
        Тайлан
        <DownloadIcon className="h-3.5 w-3.5" />
      </button>
      {active === 1 && addEmployeeButton}
      {active === 2 && addCourseButton}
    </div>
  );
}
