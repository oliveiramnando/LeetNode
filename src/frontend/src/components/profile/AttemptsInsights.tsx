// components/profile/AttemptsInsights.tsx
import type { RecentSubmission } from "@/types/leetnode";
import { deriveAttemptsInsights } from "@/lib/derive";

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

function StatusPill({
  children,
  tone = "danger",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : tone === "danger"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
      : "border-white/10 bg-white/[0.04] text-zinc-300";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
        toneClasses,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function EmptyMiniState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
      {children}
    </div>
  );
}

export function AttemptsInsights({ recent }: { recent: RecentSubmission[] }) {
  const metrics = deriveAttemptsInsights(recent);

  return (
    <PanelCard className="h-full">
      <SectionTitle
        title="Attempts → Success"
        subtitle="Retry patterns and non-accepted status distribution."
        right={
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {metrics.recentAcceptancePct}% recent AC
          </div>
        }
      />

      <div className="space-y-5 p-5 sm:p-6">
        <StatCard
          label="Recent acceptance"
          value={`${metrics.recentAcceptancePct}%`}
          hint="Accepted / total recent submissions"
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Retry → Accepted
            </div>

            <div className="mt-4 space-y-3">
              {metrics.retryToAcLines.length ? (
                metrics.retryToAcLines.slice(0, 5).map((line) => (
                  <div
                    key={line}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-6 text-zinc-300"
                  >
                    {line}
                  </div>
                ))
              ) : (
                <EmptyMiniState>
                  No retry-to-accepted patterns detected.
                </EmptyMiniState>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Common errors
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {metrics.nonAcceptedErrorCounts.length ? (
                metrics.nonAcceptedErrorCounts.slice(0, 6).map((error) => (
                  <StatusPill key={error.status} tone="danger">
                    {error.status}: {error.count}
                  </StatusPill>
                ))
              ) : (
                <EmptyMiniState>No errors found. All accepted.</EmptyMiniState>
              )}
            </div>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}