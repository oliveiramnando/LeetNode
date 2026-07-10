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
import { TagAnalysisPanel } from "@/components/profile/TagAnalysisPanel";

function normalizeLc(username: any) {
  return String(username || "").trim().toLowerCase();
}

type ProfileTab = "stats" | "analysis" | "tags";

type Props = {
  profileUsername: string;
  solvedMetrics: any;
  heatmap: any;
  matched: LeetNodeUserPayload["user"]["matchedUser"];
  recentSubmissionList: any[];
};

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-emerald-400/40",
        active
          ? "border border-white/10 bg-white/[0.08] text-white"
          : "border border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.055] hover:text-white",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function PrivateHint() {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-zinc-400">
      Submission and tag analysis are private to the profile owner.
    </div>
  );
}

export function ProfileSections({
  profileUsername,
  solvedMetrics,
  heatmap,
  matched,
  recentSubmissionList,
}: Props) {
  const { loading, loggedIn, user } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("stats");

  const isOwner = useMemo(() => {
    if (loading) return false;
    if (!loggedIn || !user) return false;

    const viewer = normalizeLc(
      user.leetcodeUsernameLower ?? user.leetcodeUsername ?? ""
    );

    const profile = normalizeLc(profileUsername);

    return viewer.length > 0 && viewer === profile;
  }, [loading, loggedIn, user, profileUsername]);

  React.useEffect(() => {
    if ((tab === "analysis" || tab === "tags") && !isOwner) {
      setTab("stats");
    }
  }, [tab, isOwner]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-zinc-950/55 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
            LeetCode Stats
          </TabButton>

          {isOwner ? (
            <>
              <TabButton
                active={tab === "analysis"}
                onClick={() => setTab("analysis")}
              >
                Submission Analysis
              </TabButton>

              <TabButton active={tab === "tags"} onClick={() => setTab("tags")}>
                Tag Analysis
              </TabButton>
            </>
          ) : null}
        </div>

        {!loading && loggedIn && !isOwner ? <PrivateHint /> : null}
      </div>

      {tab === "stats" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
            <SolvedOverviewCard metrics={solvedMetrics} />

            <BadgesSection
              badges={matched.badges}
              upcomingBadges={matched.upcomingBadges}
              activeBadgeId={matched.activeBadge?.id ?? null}
            />
          </div>

          <SubmissionHeatmap grid={heatmap} />

          <div className="space-y-5">
            <AttemptsInsights recent={recentSubmissionList} />
            <RecentSubmissionsTable submissions={recentSubmissionList} />
          </div>
        </div>
      ) : tab === "analysis" ? (
        <SubmissionsAnalysisPanel profileUsername={profileUsername} />
      ) : (
        <TagAnalysisPanel profileUsername={profileUsername} />
      )}
    </section>
  );
}