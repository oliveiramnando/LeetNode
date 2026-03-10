// src/frontend/src/components/profile/TagAnalysisPanel.tsx
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

type WeakTag = {
  tag: string;
  attemptedProblems: number;
  acceptedProblems: number;
  failedProblems: number;
  acceptanceRate: number;
};

type TagWeaknessesResponse =
  | { success: false; message?: string }
  | {
      success: true;
      weakestTags?: WeakTag[];
      tagStats?: WeakTag[];
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

const BAR_COLORS = [
  "#f97316",
  "#fb923c",
  "#fdba74",
  "#f59e0b",
  "#facc15",
  "#f43f5e",
  "#a855f7",
  "#38bdf8",
  "#22c55e",
  "#94a3b8",
];

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

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(36,36,36,0.98),rgba(24,24,27,0.98))] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_50px_rgba(0,0,0,0.32)] ${className}`}
    >
      <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_42%)] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold tracking-tight text-white sm:text-lg">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-sm text-zinc-400">{subtitle}</div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
      <span className="text-zinc-400">{label}:</span>{" "}
      <span className="font-medium text-zinc-100">{value}</span>
    </div>
  );
}

export function TagAnalysisPanel({
  profileUsername,
}: {
  profileUsername: string;
}) {
  const { loading, loggedIn, user } = useAuth();

  const [strengthsData, setStrengthsData] =
    React.useState<TagStrengthsResponse | null>(null);
  const [weaknessesData, setWeaknessesData] =
    React.useState<TagWeaknessesResponse | null>(null);
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

        const [strengthsRes, weaknessesRes] = await Promise.all([
          fetch(`${backend}/api/tags/strengths`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch(`${backend}/api/tags/weaknesses`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
        ]);

        const strengthsJson =
          (await strengthsRes.json()) as TagStrengthsResponse;
        const weaknessesJson =
          (await weaknessesRes.json()) as TagWeaknessesResponse;

        if (!alive) return;
        setStrengthsData(strengthsJson);
        setWeaknessesData(weaknessesJson);
      } catch (e: any) {
        if (!alive) return;
        setStrengthsData({
          success: false,
          message: e?.message ?? "Failed to load tag strengths.",
        });
        setWeaknessesData({
          success: false,
          message: e?.message ?? "Failed to load tag weaknesses.",
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
      <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="text-lg font-semibold text-white">
          Tag analysis is private
        </div>
        <div className="mt-2 text-sm text-zinc-400">
          Only the profile owner can view tag analysis.
        </div>
      </div>
    );
  }

  const tagMap =
    strengthsData && strengthsData.success === true
      ? strengthsData.tagMap ?? {}
      : {};

  const tags =
    strengthsData && strengthsData.success === true
      ? (
          strengthsData.tags ??
          Object.entries(tagMap).map(([tag, acceptedCount]) => ({
            tag,
            acceptedCount,
          }))
        ).sort((a, b) => b.acceptedCount - a.acceptedCount)
      : [];

  const weakestTags =
    weaknessesData && weaknessesData.success === true
      ? weaknessesData.weakestTags ?? []
      : [];

  const maxBars = Math.max(1, ...tags.map((t) => t.acceptedCount));
  const topicData = buildTopicDistribution(tagMap);
  const topicMax = Math.max(1, ...topicData.map((d) => d.count));

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_28%),linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-white">
              Tag Analysis
            </div>
            <div className="mt-2 max-w-2xl text-sm text-zinc-400">
              View your strongest topic tags, broader topic coverage, and the
              tags where your acceptance rate is currently weakest.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {strengthsData &&
              strengthsData.success === true &&
              strengthsData.stats && (
                <>
                  {typeof strengthsData.stats.uniqueAcceptedProblemsCount ===
                    "number" && (
                    <StatPill
                      label="Unique solved"
                      value={strengthsData.stats.uniqueAcceptedProblemsCount}
                    />
                  )}
                  {typeof strengthsData.stats.acceptedSubmissionsCount ===
                    "number" && (
                    <StatPill
                      label="Accepted submissions"
                      value={strengthsData.stats.acceptedSubmissionsCount}
                    />
                  )}
                  {typeof strengthsData.stats.tagCount === "number" && (
                    <StatPill
                      label="Tracked tags"
                      value={strengthsData.stats.tagCount}
                    />
                  )}
                </>
              )}

            {weakestTags.length > 0 && (
              <StatPill label="Weakest tags shown" value={weakestTags.length} />
            )}
          </div>
        </div>
      </div>

      {loadingData ? (
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 text-sm text-zinc-300">
          Loading…
        </div>
      ) : !strengthsData ? (
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 text-sm text-zinc-300">
          No data yet.
        </div>
      ) : strengthsData.success === false ? (
        <div className="rounded-3xl border border-red-500/20 bg-[linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 text-sm text-red-400">
          {strengthsData.message ?? "Failed to load."}
        </div>
      ) : tags.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 text-sm text-zinc-300">
          No accepted submissions found yet.
        </div>
      ) : (
        <>
          <SectionCard
            title="Weakest Tags"
            subtitle="Lowest acceptance rate among tags with at least 2 attempted problems."
          >
            {weaknessesData && weaknessesData.success === false ? (
              <div className="text-sm text-red-400">
                {weaknessesData.message ?? "Failed to load weakest tags."}
              </div>
            ) : weakestTags.length === 0 ? (
              <div className="text-sm text-zinc-400">
                No weakest-tag data yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {weakestTags.map((tag) => (
                  <div
                    key={tag.tag}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-base font-semibold text-white">
                      {tag.tag}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-zinc-500">Acceptance</div>
                        <div className="mt-1 font-medium text-rose-400">
                          {pct(tag.acceptanceRate)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-zinc-500">Failed</div>
                        <div className="mt-1 font-medium text-white">
                          {tag.failedProblems}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-zinc-500">Attempted</div>
                        <div className="mt-1 font-medium text-white">
                          {tag.attemptedProblems}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-zinc-500">Accepted</div>
                        <div className="mt-1 font-medium text-emerald-400">
                          {tag.acceptedProblems}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SectionCard
              title="Top Tags"
              subtitle="Based on unique solved problems."
              right={
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                  All {tags.length}
                </div>
              }
              className="h-full"
            >
              <div className="h-[420px] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {tags.map((t, idx) => {
                    const width = Math.round((t.acceptedCount / maxBars) * 100);
                    const tone = BAR_COLORS[idx % BAR_COLORS.length];

                    return (
                      <div key={t.tag} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-zinc-100">
                            {t.tag}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
                            {t.acceptedCount}
                          </span>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${width}%`,
                              background: `linear-gradient(90deg, ${tone}, #fb923c)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Topic Tags Distribution"
              subtitle="Mapped from LeetCode tags into broader topic buckets."
              className="h-full"
            >
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={topicData}>
                    <PolarGrid stroke="rgba(255,255,255,0.12)" />
                    <PolarAngleAxis
                      dataKey="topic"
                      tick={{ fontSize: 10, fill: "#d4d4d8" }}
                    />
                    <PolarRadiusAxis
                      domain={[0, topicMax]}
                      tick={{ fontSize: 10, fill: "#71717a" }}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: any) => [value, "Count"]}
                      labelFormatter={(label: any) => String(label)}
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                    />
                    <Radar
                      dataKey="count"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.22}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}