"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const AdminActiveTabContext = createContext<{
  active: number;
  setActive: (i: number) => void;
} | null>(null);

export function AdminActiveTabProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  return (
    <AdminActiveTabContext.Provider value={{ active, setActive }}>
      {children}
    </AdminActiveTabContext.Provider>
  );
}

export function useAdminActiveTab() {
  const ctx = useContext(AdminActiveTabContext);
  if (!ctx) throw new Error("useAdminActiveTab must be used within AdminActiveTabProvider");
  return ctx;
}
