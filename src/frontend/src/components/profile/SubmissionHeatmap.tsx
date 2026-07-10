// components/profile/SubmissionHeatmap.tsx
"use client";

import * as React from "react";
import type { HeatmapGrid } from "@/lib/derive";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatShortDate } from "@/lib/date";

function cellClasses(level: number) {
  switch (level) {
    case 0:
      return "bg-white/[0.035] hover:bg-white/[0.07]";
    case 1:
      return "bg-emerald-500/15 hover:bg-emerald-500/25";
    case 2:
      return "bg-emerald-500/30 hover:bg-emerald-500/40";
    case 3:
      return "bg-emerald-500/50 hover:bg-emerald-500/60";
    case 4:
      return "bg-emerald-500/75 hover:bg-emerald-500/85";
    default:
      return "bg-white/[0.035] hover:bg-white/[0.07]";
  }
}

function PanelCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "overflow-hidden rounded-3xl border border-white/10",
        "bg-zinc-950/55",
        "shadow-[0_18px_45px_rgba(0,0,0,0.25)]",
        "backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-white/10 px-5 py-4 sm:px-6">
      <h3 className="text-base font-semibold tracking-tight text-white">
        {title}
      </h3>

      {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}

export function SubmissionHeatmap({ grid }: { grid: HeatmapGrid }) {
  const weeks = grid.weeks;
  const rows = 7;

  return (
    <PanelCard className="w-full">
      <SectionTitle
        title="Submission Activity"
        subtitle={`Last ${weeks} weeks • ${formatShortDate(
          grid.startDate
        )} → ${formatShortDate(grid.endDate)}`}
      />

      <div className="p-5 sm:p-6">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${weeks}, 12px)` }}
            >
              {Array.from({ length: weeks }).map((_, col) => (
                <div key={`week-${col}`} className="grid gap-[3px]">
                  {Array.from({ length: rows }).map((__, row) => {
                    const cell = grid.cells[row][col];

                    const tip = `${formatShortDate(cell.date)}: ${
                      cell.count
                    } submission${cell.count === 1 ? "" : "s"}`;

                    if (cell.isFuture) {
                      return (
                        <div
                          key={`future-${row}-${col}-${cell.iso}`}
                          className="h-3 w-3 rounded-[4px] border border-white/5 bg-transparent"
                          aria-hidden="true"
                        />
                      );
                    }

                    return (
                      <Tooltip
                        key={`cell-${row}-${col}-${cell.iso}`}
                        content={tip}
                      >
                        <div
                          className={[
                            "h-3 w-3 rounded-[4px] border border-white/10 transition",
                            cellClasses(cell.level),
                          ].join(" ")}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Less</span>

            <div className="flex items-center gap-[3px]">
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={[
                    "h-3 w-3 rounded-[4px] border border-white/10",
                    cellClasses(lvl),
                  ].join(" ")}
                />
              ))}
            </div>

            <span>More</span>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}