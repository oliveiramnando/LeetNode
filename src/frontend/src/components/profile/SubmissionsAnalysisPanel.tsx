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

const COLORS = {
  easy: "#22c55e",
  medium: "#eab308",
  hard: "#ef4444",
  accent: "#10b981",
  muted: "rgba(255,255,255,0.10)",
};

const PIE_COLORS = [
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

function recordToData(map: Record<string, number>) {
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

  const d = new Date(value);
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

function OverallRing({
  accepted,
  total,
}: {
  accepted: number;
  total: number;
}) {
  const progress = pct(accepted, total);

  const data = [
    { name: "Accepted", value: progress },
    { name: "Remaining", value: Math.max(0, 100 - progress) },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.045] p-5">
      <div className="h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius="74%"
              outerRadius="92%"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={COLORS.accent} />
              <Cell fill={COLORS.muted} />
            </Pie>

            <text
              x="50%"
              y="47%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              style={{ fontSize: 34, fontWeight: 800 }}
            >
              {progress}%
            </text>

            <text
              x="50%"
              y="61%"
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

      <div className="text-center">
        <div className="text-sm text-zinc-400">
          {accepted} accepted out of {total} recorded attempts
        </div>
      </div>
    </div>
  );
}

function DifficultyRow({
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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="mt-1 text-xs text-zinc-400">
            {accepted}/{total} accepted
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-semibold text-white">{progress}%</div>
          <div className="text-xs text-zinc-500">rate</div>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function LanguageBars({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: Array<{ name: string; value: number }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const topItems = data.slice(0, 6);

  return (
    <PanelCard className="h-full overflow-hidden">
      <SectionTitle title={title} subtitle={subtitle} />

      <div className="p-5 sm:p-6">
        {topItems.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-zinc-400">
            No language data yet.
          </div>
        ) : (
          <div className="space-y-4">
            {topItems.map((item, idx) => {
              const share =
                total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                        }}
                      />
                      <span className="truncate font-medium text-zinc-200">
                        {formatLabel(item.name)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="text-zinc-500">{share}%</span>
                      <span className="min-w-8 text-right font-medium text-zinc-300">
                        {item.value}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${share}%`,
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-2 text-xs text-zinc-500">
              Based on {total} recorded submission event
              {total === 1 ? "" : "s"}.
            </div>
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function TrackerChart({
  currentStreak,
  longestStreak,
  avgPerDay,
  mostActiveCount,
}: {
  currentStreak: number;
  longestStreak: number;
  avgPerDay: number;
  mostActiveCount: number;
}) {
  const chartData = [
    { name: "Current", value: currentStreak },
    { name: "Longest", value: longestStreak },
    { name: "Avg/Day", value: Number(avgPerDay.toFixed(1)) },
    { name: "Best Day", value: mostActiveCount },
  ];

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap={28}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
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
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14,
              color: "#fff",
            }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar
            dataKey="value"
            radius={[10, 10, 4, 4]}
            fill={COLORS.accent}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SubmissionTrackerSection({
  tracker,
}: {
  tracker: SubmissionTrackerResponse | null;
}) {
  if (!tracker) {
    return (
      <PanelCard className="overflow-hidden">
        <SectionTitle
          title="Submission Tracker"
          subtitle="Streaks, pace, and best active day."
        />

        <div className="p-5 sm:p-6">
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-zinc-400">
            No tracker data yet.
          </div>
        </div>
      </PanelCard>
    );
  }

  if (tracker.success === false) {
    return (
      <PanelCard className="overflow-hidden">
        <SectionTitle
          title="Submission Tracker"
          subtitle="Streaks, pace, and best active day."
        />

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 text-sm text-red-300">
            {tracker.message ?? "Failed to load submission tracker."}
          </div>
        </div>
      </PanelCard>
    );
  }

  const totalSubmissions = tracker.total_submissions ?? 0;
  const avgPerDay = tracker.avg_submissions_per_day ?? 0;
  const longestStreak = tracker.longest_streak ?? 0;
  const currentStreak = tracker.current_streak ?? 0;
  const mostActiveDay = tracker.most_active_day ?? null;
  const mostActiveCount = mostActiveDay?.submissions ?? 0;

  return (
    <PanelCard className="overflow-hidden">
      <SectionTitle
        title="Submission Tracker"
        subtitle="Streaks, pace, and best active day."
        right={
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Tracker API
          </div>
        }
      />

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Current"
              value={currentStreak}
              hint="Current streak"
            />
            <StatCard
              label="Longest"
              value={longestStreak}
              hint="Best streak"
            />
            <StatCard
              label="Average"
              value={formatAvg(avgPerDay)}
              hint="Submissions/day"
            />
            <StatCard
              label="Total"
              value={totalSubmissions}
              hint="Tracked submissions"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Most active day
                </div>

                <div className="mt-2 text-lg font-semibold text-white">
                  {formatDate(mostActiveDay?.date)}
                </div>

                <div className="mt-1 text-sm text-zinc-400">
                  {mostActiveCount} submission
                  {mostActiveCount === 1 ? "" : "s"} recorded.
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-center">
                <div className="text-xs uppercase tracking-[0.16em] text-emerald-300">
                  Best day
                </div>

                <div className="mt-1 text-3xl font-semibold text-white">
                  {mostActiveCount}
                </div>
              </div>
            </div>

            {(typeof mostActiveDay?.easy === "number" ||
              typeof mostActiveDay?.medium === "number" ||
              typeof mostActiveDay?.hard === "number") && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
                  <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Easy
                  </div>

                  <div className="mt-1 text-lg font-semibold text-emerald-400">
                    {mostActiveDay?.easy ?? 0}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
                  <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Medium
                  </div>

                  <div className="mt-1 text-lg font-semibold text-amber-400">
                    {mostActiveDay?.medium ?? 0}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
                  <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">
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

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Activity snapshot
            </div>

            <div className="mt-1 text-sm text-zinc-400">
              Quick comparison of streak and pace metrics.
            </div>
          </div>

          <TrackerChart
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            avgPerDay={avgPerDay}
            mostActiveCount={mostActiveCount}
          />
        </div>
      </div>
    </PanelCard>
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

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950/55 p-6 text-sm text-zinc-300">
        Loading…
      </div>
    );
  }

  if (!isOwner) {
    return (
      <PanelCard className="p-6">
        <div className="text-lg font-semibold text-white">
          Submission analysis is private
        </div>

        <div className="mt-2 text-sm text-zinc-400">
          Only the profile owner can view submission analysis.
        </div>
      </PanelCard>
    );
  }

  const langMap =
    langData && langData.success === true ? langData.langMap ?? {} : {};

  const acceptedLangMap =
    langData && langData.success === true
      ? langData.acceptedLangMap ?? {}
      : {};

  const langDataList = recordToData(langMap);
  const acceptedLangDataList = recordToData(acceptedLangMap);

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

  const totalAccepted = easyA + medA + hardA;
  const totalAttempts = easyT + medT + hardT;
  const overallPct = pct(totalAccepted, totalAttempts);

  const trackerOk = trackerData && trackerData.success === true;

  const topLanguage = langDataList[0] ? formatLabel(langDataList[0].name) : "—";

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
                Submission Analysis
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                A cleaner view of your solving habits, acceptance rate, language
                usage, and recent activity.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
              <StatCard
                label="Accepted"
                value={totalAccepted}
                hint={`${totalAttempts} attempts`}
              />

              <StatCard label="Rate" value={`${overallPct}%`} hint="Overall" />

              <StatCard label="Language" value={topLanguage} hint="Most used" />

              <StatCard
                label="Streak"
                value={
                  trackerOk && typeof trackerData.current_streak === "number"
                    ? trackerData.current_streak
                    : "—"
                }
                hint="Current"
              />
            </div>
          </div>
        </div>
      </PanelCard>

      {loadingData ? (
        <PanelCard className="p-6 text-sm text-zinc-300">Loading…</PanelCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <PanelCard className="overflow-hidden">
              <SectionTitle
                title="Overall Performance"
                subtitle="Combined acceptance rate across all difficulties."
              />

              <div className="p-5 sm:p-6">
                <OverallRing accepted={totalAccepted} total={totalAttempts} />
              </div>
            </PanelCard>

            <PanelCard className="overflow-hidden">
              <SectionTitle
                title="Difficulty Breakdown"
                subtitle="Acceptance rate by problem difficulty."
              />

              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3 xl:grid-cols-1">
                <DifficultyRow
                  label="Easy"
                  accepted={easyA}
                  total={easyT}
                  color={COLORS.easy}
                />

                <DifficultyRow
                  label="Medium"
                  accepted={medA}
                  total={medT}
                  color={COLORS.medium}
                />

                <DifficultyRow
                  label="Hard"
                  accepted={hardA}
                  total={hardT}
                  color={COLORS.hard}
                />
              </div>
            </PanelCard>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <LanguageBars
              title="Accepted Languages"
              subtitle="Languages used on accepted submissions."
              data={acceptedLangDataList}
            />

            <LanguageBars
              title="All Submission Languages"
              subtitle="Languages used across all recorded submissions."
              data={langDataList}
            />
          </div>

          <SubmissionTrackerSection tracker={trackerData} />
        </>
      )}
    </div>
  );
}