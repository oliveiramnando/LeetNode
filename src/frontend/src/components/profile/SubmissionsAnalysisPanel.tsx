// src/frontend/src/components/profile/SubmissionsAnalysisPanel.tsx
"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

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

const TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Sorting",
  "Stack",
  "Queue",
  "Linked Lists",
  "Trees",
  "Binary Search Trees",
  "Heaps",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "Backtracking",
  "Bit Manipulation",
  "Math",
  "Union Find",
  "Prefix Sum",
  "Recursion",
  "Divide and Conquer",
  "Design",
  "Simulation",
  "Geometry",
  "Number Theory",
] as const;

type Topic = (typeof TOPICS)[number];

const TAG_TO_TOPIC: Record<string, Topic> = {
  Array: "Arrays",
  String: "Strings",
  "Hash Table": "Hashing",
  "Two Pointers": "Two Pointers",
  "Sliding Window": "Sliding Window",
  "Binary Search": "Binary Search",
  Sorting: "Sorting",
  Stack: "Stack",
  Queue: "Queue",
  "Linked List": "Linked Lists",
  Tree: "Trees",
  "Binary Tree": "Trees",
  "Binary Search Tree": "Binary Search Trees",
  Heap: "Heaps",
  "Heap (Priority Queue)": "Heaps",
  Graph: "Graphs",
  "Dynamic Programming": "Dynamic Programming",
  Greedy: "Greedy",
  Backtracking: "Backtracking",
  "Bit Manipulation": "Bit Manipulation",
  Math: "Math",
  "Union Find": "Union Find",
  "Prefix Sum": "Prefix Sum",
  Recursion: "Recursion",
  "Divide and Conquer": "Divide and Conquer",
  Design: "Design",
  Simulation: "Simulation",
  Geometry: "Geometry",
  "Number Theory": "Number Theory",

  "Depth-First Search": "Graphs",
  "Breadth-First Search": "Graphs",
  "Topological Sort": "Graphs",
  "Shortest Path": "Graphs",

  "Monotonic Stack": "Stack",
  "Monotonic Queue": "Queue",

  Trie: "Trees",
  "Segment Tree": "Trees",

  "Binary Indexed Tree": "Prefix Sum",
  "Fenwick Tree": "Prefix Sum",
};

function buildTopicDistribution(tagMap: Record<string, number>) {
  const base: Record<Topic, number> = Object.fromEntries(
    TOPICS.map((t) => [t, 0])
  ) as Record<Topic, number>;

  for (const [tag, count] of Object.entries(tagMap || {})) {
    const topic = TAG_TO_TOPIC[tag];
    if (!topic) continue;
    base[topic] += count;
  }

  return TOPICS.map((topic) => ({ topic, count: base[topic] }));
}

export function SubmissionsAnalysisPanel({
  profileUsername,
}: {
  profileUsername: string;
}) {
  const { loading, loggedIn, user } = useAuth();
  const [data, setData] = React.useState<TagStrengthsResponse | null>(null);
  const [loadingData, setLoadingData] = React.useState(false);

  const isOwner = React.useMemo(() => {
    if (loading) return false;
    if (!loggedIn || !user) return false;
    const viewer = normalizeLc(
      user.leetcodeUsernameLower ?? user.leetcodeUsername ?? ""
    );
    const profile = normalizeLc(profileUsername);
    return viewer.length > 0 && viewer === profile;
  }, [loading, loggedIn, user, profileUsername]);

  React.useEffect(() => {
    if (!isOwner) return;

    let alive = true;
    setLoadingData(true);

    (async () => {
      try {
        const backend =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

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
        setData({
          success: false,
          message: e?.message ?? "Failed to load tag strengths.",
        });
      } finally {
        if (!alive) return;
        setLoadingData(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOwner]);

  if (loading) return <div className="text-sm text-zinc-300">Loading…</div>;

  if (!isOwner) {
    return (
      <div className="rounded-2xl border border-zinc-700/40 bg-[#242424] p-5">
        <div className="text-lg font-semibold">Submissions analysis is private</div>
        <div className="mt-2 text-sm text-zinc-300">
          Only the profile owner can view submission analysis.
        </div>
      </div>
    );
  }

  const tagMap =
    data && "success" in data && data.success === true ? (data.tagMap ?? {}) : {};

  const tags =
    data && "success" in data && data.success === true
      ? (
          data.tags ??
          Object.entries(tagMap).map(([tag, acceptedCount]) => ({
            tag,
            acceptedCount,
          }))
        ).sort((a, b) => b.acceptedCount - a.acceptedCount)
      : [];

  const maxBars = Math.max(1, ...tags.map((t) => t.acceptedCount));
  const topicData = buildTopicDistribution(tagMap);
  const topicMax = Math.max(1, ...topicData.map((d) => d.count));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Submission Analysis</div>
        <div className="mt-1 text-sm text-zinc-300">
          Unique accepted problems → topic strengths.
        </div>
      </div>

      {loadingData ? (
        <div className="rounded-2xl border border-zinc-700/40 bg-[#242424] p-5 text-sm text-zinc-300">
          Loading…
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-zinc-700/40 bg-[#242424] p-5 text-sm text-zinc-300">
          No data yet.
        </div>
      ) : "success" in data && data.success === false ? (
        <div className="rounded-2xl border border-zinc-700/40 bg-[#242424] p-5 text-sm text-red-400">
          {data.message ?? "Failed to load."}
        </div>
      ) : tags.length === 0 ? (
        <div className="rounded-2xl border border-zinc-700/40 bg-[#242424] p-5 text-sm text-zinc-300">
          No accepted submissions found yet.
        </div>
      ) : (
        <>
          {"success" in data && data.success === true && data.stats && (
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">

            {/* Top Tags */}
            <div className="flex h-[420px] flex-col rounded-2xl border border-zinc-700/40 bg-[#242424] p-5">
              <div className="mb-3">
                <div className="text-lg font-semibold">
                  Top Tags
                  <span className="ml-2 text-sm font-normal text-zinc-400">
                    (All {tags.length})
                  </span>
                </div>
                <div className="mt-1 text-sm text-zinc-300">
                  Based on unique solved problems.
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="space-y-3">
                  {tags.map((t) => {
                    const pct = Math.round((t.acceptedCount / maxBars) * 100);

                    return (
                      <div key={t.tag} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{t.tag}</span>
                          <span className="text-xs text-zinc-400">
                            {t.acceptedCount}
                          </span>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Topic Radar */}
            <div className="flex h-[420px] flex-col rounded-2xl border border-zinc-700/40 bg-[#242424] p-5">
              <div className="mb-3">
                <div className="text-lg font-semibold">Topic Distribution</div>
                <div className="mt-1 text-sm text-zinc-300">
                  Mapped from LeetCode tags → topic buckets.
                </div>
              </div>

              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={topicData}>
                    <PolarGrid stroke="rgba(255,255,255,0.15)" />
                    <PolarAngleAxis
                      dataKey="topic"
                      tick={{ fontSize: 10, fill: "#e5e5e5" }}
                    />
                    <PolarRadiusAxis
                      domain={[0, topicMax]}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: any) => [value, "Count"]}
                      labelFormatter={(label: any) => String(label)}
                    />
                    <Radar
                      dataKey="count"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.25}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}