"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { LeetNodeUserPayload } from "@/types/leetnode";

import { SolvedOverviewCard } from "@/components/profile/SolvedOverviewCard";
import { SubmissionHeatmap } from "@/components/profile/SubmissionHeatmap";
import { RecentSubmissionsTable } from "@/components/profile/RecentSubmissionsTable";
import { AttemptsInsights } from "@/components/profile/AttemptsInsights";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { SubmissionsAnalysisPanel } from "@/components/profile/SubmissionsAnalysisPanel";

function normalizeLc(username: any) {
  return String(username || "").trim().toLowerCase();
}

type Props = {
  profileUsername: string;
  solvedMetrics: any; // keep as any to avoid fighting your existing type right now
  heatmap: any;
  matched: LeetNodeUserPayload["user"]["matchedUser"];
  recentSubmissionList: any[];
};

export function ProfileSections({
  profileUsername,
  solvedMetrics,
  heatmap,
  matched,
  recentSubmissionList,
}: Props) {
  const { loading, loggedIn, user } = useAuth();
  const [tab, setTab] = useState<"stats" | "analysis">("stats");

  const isOwner = useMemo(() => {
    if (loading) return false;
    if (!loggedIn || !user) return false;
    const viewer = normalizeLc(user.leetcodeUsernameLower ?? user.leetcodeUsername ?? "");
    const profile = normalizeLc(profileUsername);
    return viewer.length > 0 && viewer === profile;
  }, [loading, loggedIn, user, profileUsername]);

  // If someone somehow lands on "analysis" but they aren't owner, force back
  React.useEffect(() => {
    if (tab === "analysis" && !isOwner) setTab("stats");
  }, [tab, isOwner]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-700/40 bg-[#1f1f1f] p-2">
        <button
          onClick={() => setTab("stats")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "stats"
              ? "bg-white text-black"
              : "text-zinc-200 hover:bg-white/10"
          }`}
        >
          LeetCode Stats
        </button>

        {isOwner && (
          <button
            onClick={() => setTab("analysis")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "analysis"
                ? "bg-white text-black"
                : "text-zinc-200 hover:bg-white/10"
            }`}
          >
            Submissions Analysis
          </button>
        )}

        {/* Optional hint if logged in but not linked */}
        {!loading && loggedIn && !isOwner && (
          <div className="ml-auto pr-3 text-xs text-zinc-400">
            Submission analysis is private to the profile owner.
          </div>
        )}
      </div>

      {/* Panel container */}
      <div className="rounded-2xl border border-zinc-700/40 bg-[#1f1f1f] p-4">
        {tab === "stats" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SolvedOverviewCard metrics={solvedMetrics} />
              <BadgesSection
                badges={matched.badges}
                upcomingBadges={matched.upcomingBadges}
                activeBadgeId={matched.activeBadge?.id ?? null}
              />
            </div>

            <SubmissionHeatmap grid={heatmap} />
            <AttemptsInsights recent={recentSubmissionList} />
            <RecentSubmissionsTable submissions={recentSubmissionList} />
          </div>
        ) : (
          <SubmissionsAnalysisPanel profileUsername={profileUsername} />
        )}
      </div>
    </div>
  );
}