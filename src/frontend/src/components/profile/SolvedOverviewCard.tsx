// components/profile/SolvedOverviewCard.tsx
import type { SolvedOverviewMetrics } from "@/lib/derive";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stat } from "@/components/ui/Stat";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";

export function SolvedOverviewCard({ metrics }: { metrics: SolvedOverviewMetrics }) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Solved Overview"
          subtitle="Coverage + acceptance rate based on your current mock dataset."
          right={<Pill tone="info">{metrics.coveragePct}% coverage</Pill>}
        />
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Solved (All)" value={metrics.solvedAll} hint={`of ${metrics.totalAll} available`} />
          <Stat label="Acceptance Rate" value={`${metrics.acceptancePct}%`} hint="AC submissions / total submissions" />
          <Stat label="Hard Solved" value={metrics.solvedHard} hint={`of ${metrics.totalHard}`} />
        </div>

        <div className="space-y-4">
          <ProgressBar
            tone="green"
            valuePct={metrics.progress.Easy.pct}
            labelLeft={
              <span className="text-white/70">
                Easy <span className="text-white/40">{metrics.solvedEasy}/{metrics.totalEasy}</span>
              </span>
            }
            labelRight={<span>{metrics.progress.Easy.pct}%</span>}
          />
          <ProgressBar
            tone="yellow"
            valuePct={metrics.progress.Medium.pct}
            labelLeft={
              <span className="text-white/70">
                Medium <span className="text-white/40">{metrics.solvedMedium}/{metrics.totalMedium}</span>
              </span>
            }
            labelRight={<span>{metrics.progress.Medium.pct}%</span>}
          />
          <ProgressBar
            tone="red"
            valuePct={metrics.progress.Hard.pct}
            labelLeft={
              <span className="text-white/70">
                Hard <span className="text-white/40">{metrics.solvedHard}/{metrics.totalHard}</span>
              </span>
            }
            labelRight={<span>{metrics.progress.Hard.pct}%</span>}
          />
        </div>
      </CardContent>
    </Card>
  );
}
