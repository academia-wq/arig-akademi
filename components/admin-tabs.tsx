"use client";

import { useState } from "react";
import clsx from "clsx";

export function AdminTabs({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="inline-flex rounded-md border border-ink/15 bg-white p-0.5">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={clsx(
              "focus-ring rounded-[6px] px-6 py-2 text-sm font-medium transition",
              active === i
                ? "bg-brand-500 text-paper shadow-[0px_0px_2px_rgba(248,123,79,0.5)]"
                : "text-ink/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">{tabs[active].content}</div>
    </div>
  );
}
