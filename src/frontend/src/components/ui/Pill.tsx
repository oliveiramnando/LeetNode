// components/ui/Pill.tsx
import * as React from "react";

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: React.PropsWithChildren<{
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}>) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-200"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/15 text-amber-200"
      : tone === "danger"
      ? "border-rose-500/20 bg-rose-500/15 text-rose-200"
      : tone === "info"
      ? "border-sky-500/20 bg-sky-500/15 text-sky-200"
      : "border-white/10 bg-white/5 text-white/80";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium",
        toneClasses,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
