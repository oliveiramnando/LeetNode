// src/frontend/src/components/ui/Tooltip.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom";

export function Tooltip({
  content,
  children,
  className = "",
  placement = "top",
  offset = 10,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  placement?: Placement;
  offset?: number;
}) {
  const anchorRef = React.useRef<HTMLSpanElement | null>(null);
  const tipRef = React.useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  React.useEffect(() => setMounted(true), []);

  const updatePosition = React.useCallback(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;

    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();

    // desired center align
    let left = a.left + a.width / 2 - t.width / 2;

    // clamp horizontally to viewport with small margin
    const margin = 8;
    left = Math.max(margin, Math.min(left, window.innerWidth - t.width - margin));

    // vertical placement
    let top =
      placement === "bottom"
        ? a.bottom + offset
        : a.top - t.height - offset;

    // if it would go off-screen, flip automatically
    if (top < margin) {
      top = a.bottom + offset;
    } else if (top + t.height > window.innerHeight - margin) {
      top = a.top - t.height - offset;
    }

    setPos({ top, left });
  }, [placement, offset]);

  React.useEffect(() => {
    if (!open) return;

    // position after mount (so we can measure tooltip size)
    const raf = requestAnimationFrame(updatePosition);

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();

    // capture scroll events from any scroll container
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  return (
    <span
      ref={anchorRef}
      className={["relative inline-flex", className].join(" ")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}

      {mounted && open
        ? createPortal(
            <div
              ref={tipRef}
              style={{ top: pos.top, left: pos.left }}
              className={[
                "fixed z-[9999]",
                "whitespace-nowrap rounded-lg border border-white/10 bg-zinc-950/95",
                "px-2 py-1 text-[11px] text-white/90 shadow-lg",
              ].join(" ")}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </span>
  );
}
