// components/profile/SubmissionHeatmap.tsx
"use client";

import * as React from "react";
import type { HeatmapGrid } from "@/lib/derive";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatShortDate } from "@/lib/date";

function cellClasses(level: number) {
  switch (level) {
    case 0:
      return "bg-white/[0.04] hover:bg-white/[0.08]";
    case 1:
      return "bg-emerald-500/20 hover:bg-emerald-500/30";
    case 2:
      return "bg-emerald-500/35 hover:bg-emerald-500/45";
    case 3:
      return "bg-emerald-500/55 hover:bg-emerald-500/65";
    case 4:
      return "bg-emerald-500/80 hover:bg-emerald-500/90";
    default:
      return "bg-white/[0.04] hover:bg-white/[0.08]";
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
    <section
      className={[
        "overflow-hidden rounded-3xl border border-white/10",
        "bg-zinc-950/55",
        "shadow-[0_18px_45px_rgba(0,0,0,0.25)]",
        "backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </section>
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

      {subtitle ? (
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      ) : null}
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

      <div className="px-5 py-6 sm:px-6 sm:py-7">
        <div className="overflow-x-auto pb-2">
          <div className="mx-auto w-max min-w-full">
            <div className="mx-auto w-max">
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${weeks}, 13px)`,
                }}
                role="grid"
                aria-label="Submission activity heatmap"
              >
                {Array.from({ length: weeks }).map((_, col) => (
                  <div
                    key={`week-${col}`}
                    className="grid grid-rows-7 gap-1"
                    role="row"
                  >
                    {Array.from({ length: rows }).map((__, row) => {
                      const cell = grid.cells[row]?.[col];

                      if (!cell) {
                        return (
                          <div
                            key={`empty-${row}-${col}`}
                            className="size-[13px]"
                            aria-hidden="true"
                          />
                        );
                      }

                      if (cell.isFuture) {
                        return (
                          <div
                            key={`future-${cell.iso}`}
                            className="size-[13px] rounded-[4px]"
                            aria-hidden="true"
                          />
                        );
                      }

                      const tooltipText = `${formatShortDate(cell.date)}: ${
                        cell.count
                      } submission${cell.count === 1 ? "" : "s"}`;

                      return (
                        <Tooltip key={`cell-${cell.iso}`} content={tooltipText}>
                          <div
                            className={[
                              "size-[13px] rounded-[4px]",
                              "border border-white/10",
                              "transition-colors duration-150",
                              "focus-visible:outline-none",
                              "focus-visible:ring-2",
                              "focus-visible:ring-emerald-400/70",
                              cellClasses(cell.level),
                            ].join(" ")}
                            role="gridcell"
                            tabIndex={0}
                            aria-label={tooltipText}
                          />
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>Less</span>

                  <div className="flex items-center gap-1" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={[
                          "size-[13px] rounded-[4px]",
                          "border border-white/10",
                          cellClasses(level),
                        ].join(" ")}
                      />
                    ))}
                  </div>

                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}