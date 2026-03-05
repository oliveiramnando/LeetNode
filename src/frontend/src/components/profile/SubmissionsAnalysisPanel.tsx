"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";

function normalizeLc(username: any) {
  return String(username || "").trim().toLowerCase();
}

type TagStrengthsResponse =
  | { success: false; message?: string }
  | {
      success: true;
      tags?: Array<{ tag: string; acceptedCount: number }>;
      tagMap?: Record<string, number>;
      stats?: {
        acceptedSubmissionsCount?: number;
        uniqueAcceptedProblemsCount?: number;
        tagCount?: number;
        lastUpdated?: string;
      };
    };

export function SubmissionsAnalysisPanel({
  profileUsername,
}: {
  profileUsername: string;
}) {
  const { loading, loggedIn, user } = useAuth();
  const [data, setData] = React.useState<TagStrengthsResponse | null>(null);
  const [loadingData, setLoadingData] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const isOwner = React.useMemo(() => {
    if (loading) return false;
    if (!loggedIn || !user) return false;
    const viewer = normalizeLc(user.leetcodeUsernameLower ?? user.leetcodeUsername ?? "");
    const profile = normalizeLc(profileUsername);
    return viewer.length > 0 && viewer === profile;
  }, [loading, loggedIn, user, profileUsername]);

  React.useEffect(() => {
    if (!isOwner) return;

    let alive = true;
    setLoadingData(true);

    (async () => {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

        const res = await fetch(`${backend}/api/submissions/strengths`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const json = (await res.json()) as TagStrengthsResponse;
        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setData({ success: false, message: e?.message ?? "Failed to load tag strengths." });
      } finally {
        if (!alive) return;
        setLoadingData(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOwner]);

  if (loading) {
    return <div className="text-sm text-zinc-300">Loading…</div>;
  }

  if (!isOwner) {
    return (
      <div className="rounded-2xl border border-zinc-700/40 bg-[#242424] p-5">
        <div className="text-lg font-semibold">Submissions analysis is private</div>
        <div className="mt-2 text-sm text-zinc-300">
          Only the profile owner can view tag strengths right now.
        </div>
      </div>
    );
  }

  const tags =
    data && "success" in data && data.success === true
      ? (data.tags ??
          Object.entries(data.tagMap ?? {}).map(([tag, acceptedCount]) => ({
            tag,
            acceptedCount,
          }))
        ).sort((a, b) => b.acceptedCount - a.acceptedCount)
      : [];

  const visible = expanded ? tags : tags.slice(0, 5);
  const max = Math.max(1, ...visible.map((t) => t.acceptedCount));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Tag Strengths</div>
        <div className="mt-1 text-sm text-zinc-300">
          Based on accepted submissions stored in your database.
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-700/40 bg-[#242424] p-5">
        {loadingData ? (
          <div className="text-sm text-zinc-300">Loading tag strengths…</div>
        ) : !data ? (
          <div className="text-sm text-zinc-300">No data yet.</div>
        ) : "success" in data && data.success === false ? (
          <div className="text-sm text-red-400">{data.message ?? "Failed to load."}</div>
        ) : tags.length === 0 ? (
          <div className="text-sm text-zinc-300">
            No accepted submissions found yet (or you haven’t synced submissions).
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats row (optional, but nice) */}
            {"success" in data &&
              data.success === true &&
              data.stats && (
                <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                  {typeof data.stats.uniqueAcceptedProblemsCount === "number" && (
                    <span className="rounded-full border border-zinc-700/50 bg-[#1f1f1f] px-3 py-1">
                      Unique solved: {data.stats.uniqueAcceptedProblemsCount}
                    </span>
                  )}
                  {typeof data.stats.acceptedSubmissionsCount === "number" && (
                    <span className="rounded-full border border-zinc-700/50 bg-[#1f1f1f] px-3 py-1">
                      Accepted submissions: {data.stats.acceptedSubmissionsCount}
                    </span>
                  )}
                  {typeof data.stats.tagCount === "number" && (
                    <span className="rounded-full border border-zinc-700/50 bg-[#1f1f1f] px-3 py-1">
                      Tags: {data.stats.tagCount}
                    </span>
                  )}
                </div>
              )}

            {/* Horizontal bar chart */}
            <div className="space-y-3">
              {visible.map((t) => {
                const pct = Math.round((t.acceptedCount / max) * 100);
                return (
                  <div key={t.tag} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="truncate text-sm font-medium">{t.tag}</div>
                      <div className="shrink-0 text-xs text-zinc-300">{t.acceptedCount}</div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-white/80"
                        style={{ width: `${pct}%` }}
                        aria-label={`${t.tag}: ${t.acceptedCount}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View more / less */}
            {tags.length > 5 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/50 bg-[#1f1f1f] px-3 py-2 text-xs font-medium text-zinc-100 transition hover:bg-white/10"
              >
                {expanded ? "View less" : "View more"}
                <span className="text-zinc-400">
                  ({expanded ? "Top 5" : `All ${tags.length}`})
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}