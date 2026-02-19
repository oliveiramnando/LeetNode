// components/ui/ProgressBar.tsx
import * as React from "react";

export function ProgressBar({
  valuePct,
  className = "",
  labelLeft,
  labelRight,
  tone = "neutral",
}: {
  valuePct: number; // 0..100
  className?: string;
  labelLeft?: React.ReactNode;
  labelRight?: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "neutral";
}) {
  const clamped = Math.max(0, Math.min(100, valuePct));
  const toneClasses =
    tone === "green"
      ? "bg-emerald-500/70"
      : tone === "yellow"
      ? "bg-amber-500/70"
      : tone === "red"
      ? "bg-rose-500/70"
      : "bg-white/40";

  return (
    <div className={className}>
      {(labelLeft || labelRight) && (
        <div className="mb-2 flex items-center justify-between text-[11px] text-white/60">
          <div>{labelLeft}</div>
          <div>{labelRight}</div>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-white/10">
        <div
          className={[
            "h-2 rounded-full transition-[width] duration-500 ease-out",
            toneClasses,
          ].join(" ")}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
