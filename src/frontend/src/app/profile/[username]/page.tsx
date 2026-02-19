// src/frontend/src/app/profile/[username]/page.tsx
import type { LeetNodeUserPayload } from "@/types/leetnode";
import { normalizeBackendLeetCodeUser } from "@/lib/normalize";
import { deriveSolvedOverview, deriveYearHeatmap } from "@/lib/derive";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SolvedOverviewCard } from "@/components/profile/SolvedOverviewCard";
import { SubmissionHeatmap } from "@/components/profile/SubmissionHeatmap";
import { RecentSubmissionsTable } from "@/components/profile/RecentSubmissionsTable";
import { AttemptsInsights } from "@/components/profile/AttemptsInsights";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { EmptyState } from "@/components/profile/EmptyState";

async function getProfile(username: string): Promise<LeetNodeUserPayload | null> {
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const res = await fetch(
    `${origin}/api/leetcode/user/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return normalizeBackendLeetCodeUser(json);
}


export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string };
}) {
  const resolvedParams = await params; // works whether params is a Promise or not
  const username = resolvedParams?.username;

  if (!username) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <EmptyState title="Missing username" description="No username was provided in the route." />
      </div>
    );
  }

  const payload = await getProfile(username);

  if (!payload?.user?.matchedUser) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <EmptyState
          title="Profile unavailable"
          description="Backend response didn’t include the fields needed for this UI yet."
        />
      </div>
    );
  }

  const matched = payload.user.matchedUser;
  const solvedMetrics = deriveSolvedOverview(payload.user.allQuestionsCount, matched.submitStats);
  const heatmap = deriveYearHeatmap(matched.submissionCalendar, new Date(), 52);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="space-y-6">
        <ProfileHeader user={matched} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SolvedOverviewCard metrics={solvedMetrics} />
          <BadgesSection
            badges={matched.badges}
            upcomingBadges={matched.upcomingBadges}
            activeBadgeId={matched.activeBadge?.id ?? null}
          />
        </div>

        <SubmissionHeatmap grid={heatmap} />
        <AttemptsInsights recent={payload.user.recentSubmissionList} />
        <RecentSubmissionsTable submissions={payload.user.recentSubmissionList} />
      </div>
    </div>
  );
}
