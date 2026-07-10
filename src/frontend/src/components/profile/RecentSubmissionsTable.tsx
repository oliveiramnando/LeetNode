// components/profile/RecentSubmissionsTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { RecentSubmission } from "@/types/leetnode";
import { SubmissionsFilterBar } from "@/components/profile/SubmissionsFilterBar";
import {
  filterSubmissions,
  listLanguages,
  type SubmissionFilters,
} from "@/lib/derive";
import { timeAgoFromUnixSeconds } from "@/lib/date";

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
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h3>

        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function statusClasses(status: string) {
  if (status === "Accepted") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "Wrong Answer") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-rose-500/20 bg-rose-500/10 text-rose-300";
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}

export function RecentSubmissionsTable({
  submissions,
}: {
  submissions: RecentSubmission[];
}) {
  const top15 = submissions.slice(0, 15);
  const languages = React.useMemo(() => listLanguages(top15), [top15]);

  const [filters, setFilters] = React.useState<SubmissionFilters>({
    status: "All",
    lang: "All",
  });

  const filtered = React.useMemo(
    () => filterSubmissions(top15, filters),
    [top15, filters]
  );

  return (
    <PanelCard className="h-full">
      <SectionTitle
        title="Recent Submissions"
        subtitle="Last 15 submissions. Filter by status or language."
        right={
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
            {filtered.length} shown
          </div>
        }
      />

      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
          <SubmissionsFilterBar
            filters={filters}
            onChange={setFilters}
            languages={languages}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState>No submissions match these filters.</EmptyState>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/[0.025] text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <th className="px-4 py-3 font-medium">Problem</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Language</th>
                    <th className="px-4 py-3 font-medium">When</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((submission, idx) => {
                    const unix = Number(submission.timestamp);
                    const when = Number.isFinite(unix)
                      ? timeAgoFromUnixSeconds(unix)
                      : "—";

                    const href = `https://leetcode.com/problems/${submission.titleSlug}/`;

                    return (
                      <tr
                        key={`${submission.titleSlug}-${submission.timestamp}-${idx}`}
                        className="group transition hover:bg-white/[0.025]"
                      >
                        <td className="border-t border-white/10 px-4 py-3">
                          <Link
                            href={href}
                            target="_blank"
                            className="inline-flex max-w-[360px] items-center gap-2 text-sm font-medium text-zinc-100 transition hover:text-white"
                          >
                            <span className="truncate">{submission.title}</span>
                            <span className="text-zinc-600 opacity-0 transition group-hover:opacity-100">
                              ↗
                            </span>
                          </Link>
                        </td>

                        <td className="border-t border-white/10 px-4 py-3">
                          <span
                            className={[
                              "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
                              statusClasses(submission.statusDisplay),
                            ].join(" ")}
                          >
                            {submission.statusDisplay}
                          </span>
                        </td>

                        <td className="border-t border-white/10 px-4 py-3">
                          <span className="text-sm text-zinc-400">
                            {submission.lang}
                          </span>
                        </td>

                        <td className="border-t border-white/10 px-4 py-3">
                          <span className="text-sm text-zinc-500">{when}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filtered.map((submission, idx) => {
                const unix = Number(submission.timestamp);
                const when = Number.isFinite(unix)
                  ? timeAgoFromUnixSeconds(unix)
                  : "—";

                const href = `https://leetcode.com/problems/${submission.titleSlug}/`;

                return (
                  <Link
                    key={`${submission.titleSlug}-${submission.timestamp}-${idx}`}
                    href={href}
                    target="_blank"
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/20 hover:bg-white/[0.055]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {submission.title}
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {submission.lang} • {when}
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
                          statusClasses(submission.statusDisplay),
                        ].join(" ")}
                      >
                        {submission.statusDisplay}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PanelCard>
  );
}