"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { AppTopBar } from "@/components/app-topbar";
import { AppFooter } from "@/components/app-footer";

export function AppShell({
  isStaff,
  fullName,
  email,
  position,
  avatarUrl,
  children,
}: {
  isStaff: boolean;
  fullName: string | null;
  email: string | null;
  position: string | null;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar
        isStaff={isStaff}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar
          fullName={fullName}
          email={email}
          position={position}
          avatarUrl={avatarUrl}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:py-8 sm:pl-8 sm:pr-8 lg:pr-[120px]">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
