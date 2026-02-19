// components/ui/Tabs.tsx
"use client";

import * as React from "react";

export type TabOption<T extends string> = { label: string; value: T };

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: TabOption<T>[];
  className?: string;
}) {
  return (
    <div className={["inline-flex rounded-xl border border-white/10 bg-white/5 p-1", className].join(" ")}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              active ? "bg-white/10 text-white" : "text-white/60 hover:text-white/90",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
