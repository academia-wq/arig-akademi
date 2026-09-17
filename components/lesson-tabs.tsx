"use client";

import { useState } from "react";
import clsx from "clsx";

export function LessonTabs({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-6 border-b border-ink/10">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={clsx(
              "focus-ring -mb-px border-b-2 py-3 text-sm font-medium transition",
              active === i
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">{tabs[active].content}</div>
    </div>
  );
}
