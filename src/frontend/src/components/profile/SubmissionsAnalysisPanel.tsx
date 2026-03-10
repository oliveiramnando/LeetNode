// src/frontend/src/components/profile/SubmissionsAnalysisPanel.tsx
"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function normalizeLc(username: any) {
  return String(username || "").trim().toLowerCase();
}

type LangDistributionResponse =
  | { success: false; message?: string }
  | {
      success: true;
      langMap?: Record<string, number>;
      acceptedLangMap?: Record<string, number>;
    };

type DifficultyPerformanceResponse =
  | { success: false; message?: string }
  | {
      success: true;
      easy?: [number, number];
      medium?: [number, number];
      hard?: [number, number];
    };

type SubmissionTrackerResponse =
  | { success: false; message?: string }
  | {
      success: true;
      total_submissions?: number;
      avg_submissions_per_day?: number;
      longest_streak?: number;
      current_streak?: number;
      most_active_day?: {
        date?: string;
        submissions?: number;
        easy?: number;
        medium?: number;
        hard?: number;
      } | null;
    };

const PIE_COLORS = [
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

function recordToPieData(map: Record<string, number>) {
  return Object.entries(map || {})
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function pct(accepted: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((accepted / total) * 100);
}

function formatLabel(value: string) {
  if (!value) return value;
  if (value === "python3") return "Python";
  if (value === "cpp") return "C++";
  if (value === "javascript") return "JavaScript";
  if (value === "typescript") return "TypeScript";
  return value;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAvg(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.0";
  return value.toFixed(1);
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

function MetricMiniCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-400">{hint}</div> : null}
    </div>
  );
}

function DifficultyPercentCard({
  label,
  accepted,
  total,
  color,
}: {
  label: string;
  accepted: number;
  total: number;
  color: string;
}) {
  const progress = pct(accepted, total);
  const data = [
    { name: "Progress", value: progress },
    { name: "Remaining", value: Math.max(0, 100 - progress) },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-80"
        style={{
          background: `linear-gradient(180deg, ${color}20 0%, transparent 100%)`,
        }}
      />

      <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {progress}%
          </div>
        </div>

        <div
          className="rounded-full border px-3 py-1 text-xs font-medium"
          style={{
            borderColor: `${color}55`,
            color,
            backgroundColor: `${color}18`,
          }}
        >
          {accepted}/{total}
        </div>
      </div>

      <div className="relative z-10 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius="72%"
              outerRadius="90%"
              paddingAngle={0}
              isAnimationActive={false}
              cornerRadius={999}
            >
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.10)" />
            </Pie>

            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              style={{ fontSize: 30, fontWeight: 700 }}
            >
              {progress}%
            </text>
            <text
              x="50%"
              y="60%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#a1a1aa"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              accepted
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="relative z-10 mt-1">
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

function DonutMetricCard({
  title,
  subtitle,
  data,
  totalLabel,
}: {
  title: string;
  subtitle: string;
  data: Array<{ name: string; value: number }>;
  totalLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const topItems = data.slice(0, 4);

  return (
    <SectionCard title={title} subtitle={subtitle} className="h-full">
      {data.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-zinc-400">
          No language data yet.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-center">
          <div className="h-[280px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    value,
                    formatLabel(String(name)),
                  ]}
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    color: "#fff",
                  }}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="86%"
                  paddingAngle={3}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={`${entry.name}-${idx}`}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>

                <text
                  x="50%"
                  y="47%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  style={{ fontSize: 28, fontWeight: 700 }}
                >
                  {total}
                </text>
                <text
                  x="50%"
                  y="59%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#a1a1aa"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  {totalLabel}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Top languages
              </div>
              <div className="mt-4 space-y-3">
                {topItems.map((item, idx) => {
                  const share =
                    total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[idx % PIE_COLORS.length],
                            }}
                          />
                          <span className="truncate text-zinc-200">
                            {formatLabel(item.name)}
                          </span>
                        </div>
                        <span className="text-zinc-400">{item.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/7">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${share}%`,
                            backgroundColor:
                              PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-400">
              Distribution is based on recorded submission events for this user.
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function SubmissionTrackerCard({
  tracker,
}: {
  tracker: SubmissionTrackerResponse | null;
}) {
  const ok = !!tracker && tracker.success === true;

  const totalSubmissions = ok ? tracker.total_submissions ?? 0 : 0;
  const avgPerDay = ok ? tracker.avg_submissions_per_day ?? 0 : 0;
  const longestStreak = ok ? tracker.longest_streak ?? 0 : 0;
  const currentStreak = ok ? tracker.current_streak ?? 0 : 0;
  const mostActiveDay = ok ? tracker.most_active_day ?? null : null;
  const mostActiveCount = mostActiveDay?.submissions ?? 0;

  const chartData = [
    { name: "Current", value: currentStreak },
    { name: "Longest", value: longestStreak },
    { name: "Avg/Day", value: Number(avgPerDay.toFixed(1)) },
    { name: "Best Day", value: mostActiveCount },
  ];

  if (!tracker) {
    return (
      <SectionCard
        title="Submission Tracker"
        subtitle="Current streak, longest streak, submission pace, and best day."
        className="h-full"
      >
        <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-zinc-400">
          No tracker data yet.
        </div>
      </SectionCard>
    );
  }

  if (tracker.success === false) {
    return (
      <SectionCard
        title="Submission Tracker"
        subtitle="Current streak, longest streak, submission pace, and best day."
        className="h-full"
      >
        <div className="flex h-[320px] items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.04] text-sm text-red-400">
          {tracker.message ?? "Failed to load submission tracker."}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Submission Tracker"
      subtitle="Current streak, longest streak, submission pace, and best day."
      className="h-full"
      right={
        <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
          Live from tracker API
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricMiniCard
              label="Current streak"
              value={currentStreak}
              hint="Consecutive active days"
            />
            <MetricMiniCard
              label="Longest streak"
              value={longestStreak}
              hint="Best recorded run"
            />
            <MetricMiniCard
              label="Avg submissions/day"
              value={formatAvg(avgPerDay)}
              hint="Across active days"
            />
            <MetricMiniCard
              label="Total submissions"
              value={totalSubmissions}
              hint="From tracked daily activity"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Most active day
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatDate(mostActiveDay?.date)}
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  {mostActiveCount} submissions on your busiest tracked day.
                </div>
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-center">
                <div className="text-xs uppercase tracking-[0.18em] text-orange-300">
                  Best day
                </div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {mostActiveCount}
                </div>
              </div>
            </div>

            {(typeof mostActiveDay?.easy === "number" ||
              typeof mostActiveDay?.medium === "number" ||
              typeof mostActiveDay?.hard === "number") && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Easy
                  </div>
                  <div className="mt-1 text-lg font-semibold text-emerald-400">
                    {mostActiveDay?.easy ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Medium
                  </div>
                  <div className="mt-1 text-lg font-semibold text-amber-400">
                    {mostActiveDay?.medium ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Hard
                  </div>
                  <div className="mt-1 text-lg font-semibold text-rose-400">
                    {mostActiveDay?.hard ?? 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
          <div className="mb-3">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Tracker comparison
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              Streak and pace metrics from your daily activity snapshot.
            </div>
          </div>

          <div className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={26}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#d4d4d8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals
                />
                <Tooltip
                  formatter={(value: any) => [value, "Value"]}
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    color: "#fff",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar
                  dataKey="value"
                  radius={[12, 12, 6, 6]}
                  fill="#f97316"
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function SubmissionsAnalysisPanel({
  profileUsername,
}: {
  profileUsername: string;
}) {
  const { loading, loggedIn, user } = useAuth();
  const [langData, setLangData] =
    React.useState<LangDistributionResponse | null>(null);
  const [diffData, setDiffData] =
    React.useState<DifficultyPerformanceResponse | null>(null);
  const [trackerData, setTrackerData] =
    React.useState<SubmissionTrackerResponse | null>(null);

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

        const [langRes, diffRes, trackerRes] = await Promise.all([
          fetch(`${backend}/api/submissions/lang-distribution`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch(`${backend}/api/submissions/difficulty-performance`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch(`${backend}/api/submissions/submission-tracker`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
        ]);

        const langJson = (await langRes.json()) as LangDistributionResponse;
        const diffJson =
          (await diffRes.json()) as DifficultyPerformanceResponse;
        const trackerJson =
          (await trackerRes.json()) as SubmissionTrackerResponse;

        if (!alive) return;
        setLangData(langJson);
        setDiffData(diffJson);
        setTrackerData(trackerJson);
      } catch (e: any) {
        if (!alive) return;
        setLangData({
          success: false,
          message: e?.message ?? "Failed to load language distribution.",
        });
        setDiffData({
          success: false,
          message: e?.message ?? "Failed to load difficulty performance.",
        });
        setTrackerData({
          success: false,
          message: e?.message ?? "Failed to load submission tracker.",
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
          Submission analysis is private
        </div>
        <div className="mt-2 text-sm text-zinc-400">
          Only the profile owner can view submission analysis.
        </div>
      </div>
    );
  }

  const langMap =
    langData && langData.success === true ? langData.langMap ?? {} : {};

  const acceptedLangMap =
    langData && langData.success === true
      ? langData.acceptedLangMap ?? {}
      : {};

  const langPie = recordToPieData(langMap);
  const acceptedLangPie = recordToPieData(acceptedLangMap);

  const easy = diffData && diffData.success === true ? diffData.easy : undefined;
  const medium =
    diffData && diffData.success === true ? diffData.medium : undefined;
  const hard = diffData && diffData.success === true ? diffData.hard : undefined;

  const easyA = easy?.[0] ?? 0;
  const easyT = easy?.[1] ?? 0;
  const medA = medium?.[0] ?? 0;
  const medT = medium?.[1] ?? 0;
  const hardA = hard?.[0] ?? 0;
  const hardT = hard?.[1] ?? 0;

  const trackerOk = trackerData && trackerData.success === true;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_28%),linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-white">
              Submission Analysis
            </div>
            <div className="mt-2 max-w-2xl text-sm text-zinc-400">
              A sharper view of how you solve: difficulty conversion, language
              preferences, streaks, and submission pace.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {trackerOk &&
              typeof trackerData.total_submissions === "number" && (
                <StatPill
                  label="Tracked submissions"
                  value={trackerData.total_submissions}
                />
              )}

            {trackerOk &&
              typeof trackerData.current_streak === "number" && (
                <StatPill
                  label="Current streak"
                  value={`${trackerData.current_streak} day${
                    trackerData.current_streak === 1 ? "" : "s"
                  }`}
                />
              )}

            {trackerOk &&
              typeof trackerData.longest_streak === "number" && (
                <StatPill
                  label="Longest streak"
                  value={`${trackerData.longest_streak} day${
                    trackerData.longest_streak === 1 ? "" : "s"
                  }`}
                />
              )}
          </div>
        </div>
      </div>

      {loadingData ? (
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(36,36,36,0.96),rgba(24,24,27,0.96))] p-6 text-sm text-zinc-300">
          Loading…
        </div>
      ) : (
        <>
          <SubmissionTrackerCard tracker={trackerData} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <SectionCard
                title="Difficulty Performance"
                subtitle="Acceptance rate across Easy, Medium, and Hard."
                className="h-full"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DifficultyPercentCard
                    label="Easy"
                    accepted={easyA}
                    total={easyT}
                    color="#22c55e"
                  />
                  <DifficultyPercentCard
                    label="Medium"
                    accepted={medA}
                    total={medT}
                    color="#eab308"
                  />
                  <DifficultyPercentCard
                    label="Hard"
                    accepted={hardA}
                    total={hardT}
                    color="#ef4444"
                  />
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-5">
              <DonutMetricCard
                title="Accepted Language Distribution"
                subtitle="Accepted submissions only."
                data={acceptedLangPie}
                totalLabel="accepted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <SectionCard
                title="Overall Performance"
                subtitle="Combined acceptance rate across all difficulties."
                className="h-full"
              >
                <div className="mx-auto max-w-[420px]">
                  <DifficultyPercentCard
                    label="Overall"
                    accepted={easyA + medA + hardA}
                    total={easyT + medT + hardT}
                    color="#f97316"
                  />
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-5">
              <DonutMetricCard
                title="Language Distribution"
                subtitle="All recorded submissions."
                data={langPie}
                totalLabel="submissions"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}