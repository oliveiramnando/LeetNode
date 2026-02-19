// components/ui/Stat.tsx
import * as React from "react";

export function Stat({
  label,
  value,
  hint,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={["rounded-xl border border-white/10 bg-white/5 p-3", className].join(" ")}>
      <div className="text-[11px] text-white/60">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-white/50">{hint}</div> : null}
    </div>
  );
}
