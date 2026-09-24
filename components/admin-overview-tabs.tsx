"use client";

import { AdminTabs } from "@/components/admin-tabs";
import { useAdminActiveTab } from "@/components/admin-active-tab-context";

export function AdminOverviewTabs({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const { setActive } = useAdminActiveTab();
  return <AdminTabs tabs={tabs} onActiveChange={setActive} />;
}
