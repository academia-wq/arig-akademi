"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type Side = "top" | "bottom" | "left";

// Дүрс товч дээр хулгана аваачих (эсвэл гараар focus хийх) үед гарах жижиг тайлбар.
// position: fixed тул гүйлгэдэг (overflow) хайрцаг дотор ч тайрагдахгүй.
export function Tooltip({
  label,
  side = "top",
  hidden = false,
  children,
}: {
  label: string;
  side?: Side;
  hidden?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function show() {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    if (side === "top") setPos({ x: r.left + r.width / 2, y: r.top - 6 });
    else if (side === "bottom") setPos({ x: r.left + r.width / 2, y: r.bottom + 6 });
    else setPos({ x: r.left - 6, y: r.top + r.height / 2 });
  }
  const hide = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [pos]);

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) show();
      }}
      onBlur={hide}
    >
      {children}
      {pos && !hidden && (
        <span
          role="tooltip"
          style={{ left: pos.x, top: pos.y }}
          className={clsx(
            "pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-paper shadow-md",
            side === "top" && "-translate-x-1/2 -translate-y-full",
            side === "bottom" && "-translate-x-1/2",
            side === "left" && "-translate-x-full -translate-y-1/2"
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
