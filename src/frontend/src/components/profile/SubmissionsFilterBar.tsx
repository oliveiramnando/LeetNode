// components/profile/SubmissionsFilterBar.tsx
"use client";

import * as React from "react";
import type { SubmissionFilters, SubmissionStatusFilter } from "@/lib/derive";
import { Tabs } from "@/components/ui/Tabs";

export function SubmissionsFilterBar({
  filters,
  onChange,
  languages,
}: {
  filters: SubmissionFilters;
  onChange: (next: SubmissionFilters) => void;
  languages: string[];
}) {
  const statusOptions: { label: string; value: SubmissionStatusFilter }[] = [
    { label: "All", value: "All" },
    { label: "Accepted", value: "Accepted" },
    { label: "Wrong", value: "Wrong Answer" },
    { label: "TLE", value: "Time Limit Exceeded" },
    { label: "RE", value: "Runtime Error" },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={filters.status}
        onChange={(v) => onChange({ ...filters, status: v })}
        options={statusOptions}
      />

      <div className="flex items-center gap-2">
        <label className="text-xs text-white/60">Language</label>
        <select
          value={filters.lang}
          onChange={(e) => onChange({ ...filters, lang: e.target.value })}
          className={[
            "h-9 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-sm text-white",
            "outline-none ring-0 focus:border-white/20",
          ].join(" ")}
        >
          <option value="All">All</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
