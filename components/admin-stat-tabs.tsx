"use client";

import { useState } from "react";
import clsx from "clsx";

export function AdminStatTabs({
  tabs,
}: {
  tabs: { label: string; value: string | number; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={clsx(
              "focus-ring rounded-2xl p-5 text-left transition",
              active === i
                ? "bg-brand-500 shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                : "border border-ink/15 bg-white hover:border-brand-300"
            )}
          >
            <p
              className={clsx(
                "text-sm font-medium",
                active === i ? "text-paper" : "text-ink"
              )}
            >
              {tab.label}
            </p>
            <p
              className={clsx(
                "mt-2 text-[28px] leading-9",
                active === i ? "text-paper" : "text-ink"
              )}
            >
              {tab.value}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6">{tabs[active].content}</div>
    </div>
  );
}
