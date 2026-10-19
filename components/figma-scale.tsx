"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Figma-д тогтмол өргөнөөр (designWidth) зурсан хэсгийг боломжит өргөнд жигд томруулж/жижигрүүлнэ.
// CSS zoom нь layout-д нөлөөлдөг тул видео, карт, бичиг, зай бүгд Figma-ийн харьцаагаа хадгална.
// minWidth-ээс нарийн (таблет, утас) үед томруулахгүй — тэнд энгийн responsive байрлал ажиллана.
export function FigmaScale({
  designWidth,
  minWidth = 900,
  maxScale = 2,
  children,
}: {
  designWidth: number;
  minWidth?: number;
  maxScale?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (width: number) =>
      setScale(width >= minWidth ? Math.min(width / designWidth, maxScale) : null);
    update(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [designWidth, minWidth, maxScale]);

  return (
    <div ref={ref} className="w-full">
      <div style={scale ? { width: designWidth, zoom: scale } : undefined}>{children}</div>
    </div>
  );
}
