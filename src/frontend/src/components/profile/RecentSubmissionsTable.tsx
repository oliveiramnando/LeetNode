// components/profile/RecentSubmissionsTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { RecentSubmission } from "@/types/leetnode";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Pill } from "@/components/ui/Pill";
import { SubmissionsFilterBar } from "@/components/profile/SubmissionsFilterBar";
import { filterSubmissions, listLanguages, type SubmissionFilters } from "@/lib/derive";
import { timeAgoFromUnixSeconds } from "@/lib/date";

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "Accepted") return "success";
  if (status === "Wrong Answer") return "warning";
  return "danger";
}

export function RecentSubmissionsTable({ submissions }: { submissions: RecentSubmission[] }) {
  const top15 = submissions.slice(0, 15);

  const languages = React.useMemo(() => listLanguages(top15), [top15]);

  const [filters, setFilters] = React.useState<SubmissionFilters>({
    status: "All",
    lang: "All",
  });

  const filtered = React.useMemo(() => filterSubmissions(top15, filters), [top15, filters]);

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Recent Submissions"
          subtitle="Last 15 submissions • filter by status/language • click a row to open the problem."
        />
        <div className="mt-4">
          <SubmissionsFilterBar filters={filters} onChange={setFilters} languages={languages} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-white/50">
                <th className="pb-3">Problem</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Language</th>
                <th className="pb-3">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const unix = Number(s.timestamp);
                const when = Number.isFinite(unix) ? timeAgoFromUnixSeconds(unix) : "—";
                const href = `https://leetcode.com/problems/${s.titleSlug}/`;

                return (
                  <tr key={`${s.titleSlug}-${s.timestamp}-${idx}`}>
                    <td className="border-t border-white/10 py-3 pr-3">
                      <Link
                        href={href}
                        target="_blank"
                        className="group inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
                      >
                        <span className="line-clamp-1">{s.title}</span>
                        <span className="opacity-0 transition group-hover:opacity-100 text-white/40">↗</span>
                      </Link>
                    </td>
                    <td className="border-t border-white/10 py-3 pr-3">
                      <Pill tone={statusTone(s.statusDisplay)}>{s.statusDisplay}</Pill>
                    </td>
                    <td className="border-t border-white/10 py-3 pr-3">
                      <span className="text-sm text-white/70">{s.lang}</span>
                    </td>
                    <td className="border-t border-white/10 py-3">
                      <span className="text-sm text-white/60">{when}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/70">
              No submissions match these filters.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
