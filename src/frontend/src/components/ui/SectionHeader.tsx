// components/ui/SectionHeader.tsx
import * as React from "react";

export function SectionHeader({
  title,
  subtitle,
  right,
  className = "",
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["flex items-start justify-between gap-4", className].join(" ")}>
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white/90">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-white/60">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
