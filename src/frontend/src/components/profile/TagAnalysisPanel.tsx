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
  attemptedProblems?: number;
  acceptedProblems?: number;
  failedProblems?: number;
  attemptedSubmissions?: number;
  acceptedSubmissions?: number;
  failedSubmissions?: number;
  acceptanceRate: number;
};

type Recommendation = {
  title: string;
  titleSlug: string;
  difficulty?: string;
  weakTagMatches?: number;
  matchedWeakTags?: string[];
  libraryUrl?: string | null;
  url?: string;
};

type TagWeaknessesResponse =
  | { success: false; message?: string }
  | {
      success: true;
      weakestTags?: WeakTag[];
      tagStats?: WeakTag[];
      recommendations?: Recommendation[];
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
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#38bdf8",
  "#818cf8",
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

function lerp(start: number, end: number, amount: number) {
  return Math.round(start + (end - start) * amount);
}

function getTagRankColor(index: number, total: number) {
  const start = { r: 16, g: 185, b: 129 }; // #10b981 emerald
  const end = { r: 251, g: 113, b: 133 }; // #fb7185 rose

  const amount = total <= 1 ? 0 : index / (total - 1);

  const r = lerp(start.r, end.r, amount);
  const g = lerp(start.g, end.g, amount);
  const b = lerp(start.b, end.b, amount);

  return `rgb(${r}, ${g}, ${b})`;
}

function getDifficultyClass(difficulty?: string) {
  const normalized = String(difficulty || "").toLowerCase();

  if (normalized === "easy") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized === "hard") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  }

  return "border-amber-400/20 bg-amber-500/10 text-amber-300";
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
        "rounded-3xl border border-white/10",
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

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>

      {hint ? <div className="mt-1 text-xs text-zinc-400">{hint}</div> : null}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}

function ErrorState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 text-sm text-red-300">
      {children}
    </div>
  );
}

function WeakTagCard({ tag }: { tag: WeakTag }) {
  const failed = tag.failedSubmissions ?? tag.failedProblems ?? 0;
  const attempted = tag.attemptedSubmissions ?? tag.attemptedProblems ?? 0;
  const accepted = tag.acceptedSubmissions ?? tag.acceptedProblems ?? 0;
  const acceptancePct = Math.round(tag.acceptanceRate * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-white">
            {tag.tag}
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            {accepted}/{attempted} accepted
          </div>
        </div>

        <div className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-300">
          {acceptancePct}%
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-rose-400"
          style={{ width: `${Math.max(0, Math.min(100, acceptancePct))}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Tried
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            {attempted}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Passed
          </div>
          <div className="mt-1 text-lg font-semibold text-emerald-400">
            {accepted}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Failed
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-200">
            {failed}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendedProblems({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  return (
    <PanelCard className="overflow-hidden">
      <SectionTitle
        title="Recommended Problems"
        subtitle="Problems selected from your weakest areas."
        right={
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
            {recommendations.length} shown
          </div>
        }
      />

      <div className="p-5 sm:p-6">
        {recommendations.length === 0 ? (
          <EmptyState>No recommendations available yet.</EmptyState>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const href =
                rec.url ||
                (rec.libraryUrl
                  ? `https://leetcode.com${rec.libraryUrl}`
                  : `https://leetcode.com/problems/${rec.titleSlug}/`);

              return (
                <a
                  key={rec.titleSlug}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-amber-400/40 hover:bg-white/[0.055]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-white">
                        {rec.title}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {rec.difficulty ? (
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-xs font-medium",
                              getDifficultyClass(rec.difficulty),
                            ].join(" ")}
                          >
                            {rec.difficulty}
                          </span>
                        ) : null}

                        {rec.matchedWeakTags?.map((tag) => (
                          <span
                            key={`${rec.titleSlug}-${tag}`}
                            className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 text-sm font-medium text-amber-300 transition group-hover:translate-x-0.5">
                      Open problem →
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function TopTagsPanel({
  tags,
  maxBars,
}: {
  tags: Array<{ tag: string; acceptedCount: number }>;
  maxBars: number;
}) {
  return (
    <PanelCard className="h-full overflow-hidden">
      <SectionTitle
        title="Top Tags"
        subtitle="Based on unique solved problems."
        right={
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
            All {tags.length}
          </div>
        }
      />

      <div className="p-5 sm:p-6">
        <div className="max-h-[420px] overflow-y-auto pr-2">
          <div className="space-y-4">
            {tags.map((t, idx) => {
              const width = Math.round((t.acceptedCount / maxBars) * 100);
              const tone = getTagRankColor(idx, tags.length);

              return (
                <div key={t.tag}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-zinc-100">
                      {t.tag}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
                      {t.acceptedCount}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
                        backgroundColor: tone,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

function TopicDistributionPanel({
  topicData,
  topicMax,
}: {
  topicData: Array<{ topic: Topic; count: number }>;
  topicMax: number;
}) {
  const nonZeroTopics = topicData
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <PanelCard className="h-full overflow-hidden">
      <SectionTitle
        title="Topic Coverage"
        subtitle="Mapped from LeetCode tags into broader buckets."
      />

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="h-[360px] min-w-0">
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
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14,
                  color: "#fff",
                }}
              />

              <Radar
                dataKey="count"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.22}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            Strongest buckets
          </div>

          {nonZeroTopics.length === 0 ? (
            <div className="mt-4 text-sm text-zinc-400">
              No topic coverage yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {nonZeroTopics.map((item, idx) => {
                const width = Math.round((item.count / topicMax) * 100);

                return (
                  <div key={item.topic}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-zinc-200">
                        {item.topic}
                      </span>
                      <span className="text-zinc-400">{item.count}</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor:
                            BAR_COLORS[idx % BAR_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PanelCard>
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

  if (loading) {
    return (
      <PanelCard className="p-6 text-sm text-zinc-300">Loading…</PanelCard>
    );
  }

  if (!isOwner) {
    return (
      <PanelCard className="p-6">
        <div className="text-lg font-semibold text-white">
          Tag analysis is private
        </div>

        <div className="mt-2 text-sm text-zinc-400">
          Only the profile owner can view tag analysis.
        </div>
      </PanelCard>
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

  const recommendations =
    weaknessesData && weaknessesData.success === true
      ? weaknessesData.recommendations ?? []
      : [];

  const maxBars = Math.max(1, ...tags.map((t) => t.acceptedCount));

  const topicData = buildTopicDistribution(tagMap);
  const topicMax = Math.max(1, ...topicData.map((d) => d.count));

  const stats =
    strengthsData && strengthsData.success === true
      ? strengthsData.stats
      : undefined;

  const strongestTag = tags[0]?.tag ?? "—";

  return (
    <div className="space-y-5">
      <PanelCard className="overflow-hidden">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%)]" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300">
                Private dashboard
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Tag Analysis
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                See your strongest LeetCode tags, broader topic coverage, weak
                areas, and suggested problems to close the gaps.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <StatCard
                label="Solved"
                value={stats?.uniqueAcceptedProblemsCount ?? "—"}
                hint="Unique problems"
              />

              <StatCard
                label="Accepted"
                value={stats?.acceptedSubmissionsCount ?? "—"}
                hint="Submissions"
              />

              <StatCard
                label="Tags"
                value={stats?.tagCount ?? tags.length}
                hint="Tracked"
              />

              <StatCard
                label="Strongest"
                value={strongestTag}
                hint="Top tag"
              />
            </div>
          </div>
        </div>
      </PanelCard>

      {loadingData ? (
        <PanelCard className="p-6 text-sm text-zinc-300">Loading…</PanelCard>
      ) : !strengthsData ? (
        <PanelCard className="p-6 text-sm text-zinc-300">
          No data yet.
        </PanelCard>
      ) : strengthsData.success === false ? (
        <PanelCard className="p-6">
          <ErrorState>{strengthsData.message ?? "Failed to load."}</ErrorState>
        </PanelCard>
      ) : tags.length === 0 ? (
        <PanelCard className="p-6">
          <EmptyState>No accepted submissions found yet.</EmptyState>
        </PanelCard>
      ) : (
        <>
          <PanelCard className="overflow-hidden">
            <SectionTitle
              title="Weakest Tags"
              subtitle="Lowest acceptance rate among tags with at least 2 attempted problems."
              right={
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                  {weakestTags.length} shown
                </div>
              }
            />

            <div className="p-5 sm:p-6">
              {weaknessesData && weaknessesData.success === false ? (
                <ErrorState>
                  {weaknessesData.message ?? "Failed to load weakest tags."}
                </ErrorState>
              ) : weakestTags.length === 0 ? (
                <EmptyState>No weakest-tag data yet.</EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {weakestTags.map((tag) => (
                    <WeakTagCard key={tag.tag} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          </PanelCard>

          <RecommendedProblems recommendations={recommendations} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <TopTagsPanel tags={tags} maxBars={maxBars} />

            <TopicDistributionPanel
              topicData={topicData}
              topicMax={topicMax}
            />
          </div>
        </>
      )}
    </div>
  );
}