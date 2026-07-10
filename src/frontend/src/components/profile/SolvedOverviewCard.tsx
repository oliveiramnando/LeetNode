// components/profile/SolvedOverviewCard.tsx
import type { SolvedOverviewMetrics } from "@/lib/derive";

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

function ProgressRow({
  label,
  solved,
  total,
  pct,
  color,
}: {
  label: string;
  solved: number;
  total: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <div className="font-medium text-zinc-300">
          {label}{" "}
          <span className="font-normal text-zinc-500">
            {solved}/{total}
          </span>
        </div>

        <div className="text-zinc-400">{pct}%</div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, pct))}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export function SolvedOverviewCard({
  metrics,
}: {
  metrics: SolvedOverviewMetrics;
}) {
  return (
    <PanelCard className="h-full">
      <SectionTitle
        title="Solved Overview"
        subtitle="Coverage and acceptance across available problems."
        right={
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {metrics.coveragePct}% coverage
          </div>
        }
      />

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Solved"
            value={metrics.solvedAll}
            hint={`of ${metrics.totalAll} available`}
          />

          <StatCard
            label="Acceptance"
            value={`${metrics.acceptancePct}%`}
            hint="AC submissions / total"
          />

          <StatCard
            label="Hard solved"
            value={metrics.solvedHard}
            hint={`of ${metrics.totalHard}`}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <ProgressRow
            label="Easy"
            solved={metrics.solvedEasy}
            total={metrics.totalEasy}
            pct={metrics.progress.Easy.pct}
            color="#22c55e"
          />

          <ProgressRow
            label="Medium"
            solved={metrics.solvedMedium}
            total={metrics.totalMedium}
            pct={metrics.progress.Medium.pct}
            color="#eab308"
          />

          <ProgressRow
            label="Hard"
            solved={metrics.solvedHard}
            total={metrics.totalHard}
            pct={metrics.progress.Hard.pct}
            color="#f43f5e"
          />
        </div>
      </div>
    </PanelCard>
  );
}