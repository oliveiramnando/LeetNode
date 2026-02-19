// components/profile/AttemptsInsights.tsx
import type { RecentSubmission } from "@/types/leetnode";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Pill } from "@/components/ui/Pill";
import { Stat } from "@/components/ui/Stat";
import { deriveAttemptsInsights } from "@/lib/derive";

export function AttemptsInsights({ recent }: { recent: RecentSubmission[] }) {
  const metrics = deriveAttemptsInsights(recent);

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Attempts → Success Insight"
          subtitle="Signals pulled from recent submissions: retry patterns + error distribution."
          right={<Pill tone="info">{metrics.recentAcceptancePct}% recent AC</Pill>}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <Stat label="Recent acceptance rate" value={`${metrics.recentAcceptancePct}%`} hint="Accepted / total (recent list)" />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Retry → Accepted</div>
            <div className="mt-2 space-y-2">
              {metrics.retryToAcLines.length ? (
                metrics.retryToAcLines.map((line) => (
                  <div key={line} className="text-sm text-white/75">
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/50">No retry-to-AC patterns detected in this slice.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Most common non-AC status</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {metrics.nonAcceptedErrorCounts.length ? (
                metrics.nonAcceptedErrorCounts.map((e) => (
                  <Pill key={e.status} tone="danger">
                    {e.status}: {e.count}
                  </Pill>
                ))
              ) : (
                <div className="text-sm text-white/50">No errors found (all accepted).</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
