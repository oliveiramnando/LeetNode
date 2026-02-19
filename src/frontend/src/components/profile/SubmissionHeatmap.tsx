// components/profile/SubmissionHeatmap.tsx
"use client";

import * as React from "react";
import type { HeatmapGrid } from "@/lib/derive";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatShortDate } from "@/lib/date";

function cellClasses(level: number) {
  switch (level) {
    case 0:
      return "bg-white/5 hover:bg-white/10";
    case 1:
      return "bg-orange-500/15 hover:bg-orange-500/25";
    case 2:
      return "bg-orange-500/30 hover:bg-orange-500/40";
    case 3:
      return "bg-orange-500/50 hover:bg-orange-500/60";
    case 4:
      return "bg-orange-500/75 hover:bg-orange-500/85";
    default:
      return "bg-white/5 hover:bg-white/10";
  }
}


export function SubmissionHeatmap({ grid }: { grid: HeatmapGrid }) {
  const weeks = grid.weeks;
  const rows = 7;

  // Responsive columns: allow up to 14 weeks later
  const colStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
  };

  return (
    <Card className="w-fit mx-auto">
      <CardHeader>
        <SectionHeader
          title="Submission Activity"
          subtitle={`Last ${weeks} weeks • ${formatShortDate(grid.startDate)} → ${formatShortDate(grid.endDate)}`}
        />
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Heatmap Grid (Centered) */}
          <div className="overflow-x-auto">
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${weeks}, 11px)` }}
            >
              {Array.from({ length: weeks }).map((_, col) => (
                <div key={`week-${col}`} className="grid gap-[2px]">
                  {Array.from({ length: rows }).map((__, row) => {
                    const cell = grid.cells[row][col];
                    const tip = `${formatShortDate(cell.date)}: ${cell.count} submission${cell.count === 1 ? "" : "s"}`;

                    if (cell.isFuture) {
                      // blank tile, no tooltip
                      return (
                        <div
                          key={`future-${row}-${col}-${cell.iso}`}
                          className="h-[11px] w-[11px] rounded-[3px] border border-white/5 bg-transparent"
                          aria-hidden="true"
                        />
                      );
                    }

                    return (
                      <Tooltip key={`cell-${row}-${col}-${cell.iso}`} content={tip}>
                        <div
                          className={[
                            "h-[11px] w-[11px] rounded-[3px] border border-white/10 transition",
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

          {/* Legend (Bottom Right) */}
          <div className="w-full flex justify-end">
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <span>Less</span>
              <div className="flex items-center gap-[2px]">
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <div
                    key={lvl}
                    className={[
                      "h-[11px] w-[11px] rounded-[3px] border border-white/10",
                      cellClasses(lvl),
                    ].join(" ")}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
