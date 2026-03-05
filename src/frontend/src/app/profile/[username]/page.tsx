// src/frontend/src/app/profile/[username]/page.tsx

import type { LeetNodeUserPayload } from "@/types/leetnode";
import { normalizeBackendLeetCodeUser } from "@/lib/normalize";
import { deriveSolvedOverview, deriveYearHeatmap } from "@/lib/derive";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSections } from "@/components/profile/ProfileSections";
import { EmptyState } from "@/components/profile/EmptyState";
import { ProfileSocialActions } from "@/components/profile/ProfileSocialActions";

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
  const resolvedParams = await params;
  const username = resolvedParams?.username;

  if (!username) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <EmptyState
          title="Missing username"
          description="No username was provided in the route."
        />
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

  const solvedMetrics = deriveSolvedOverview(
    payload.user.allQuestionsCount,
    matched.submitStats
  );

  const heatmap = deriveYearHeatmap(
    matched.submissionCalendar,
    new Date(),
    52
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="space-y-6">
        {/* Profile header stays static */}
        <ProfileHeader
          user={matched}
          heroAction={<ProfileSocialActions profileUsername={username} />}
        />

        {/* Tabbed container (Stats / Submissions Analysis) */}
        <ProfileSections
          profileUsername={username}
          solvedMetrics={solvedMetrics}
          heatmap={heatmap}
          matched={matched}
          recentSubmissionList={payload.user.recentSubmissionList}
        />
      </div>
    </div>
  );
}