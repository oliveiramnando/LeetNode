// src/frontend/src/components/feed/FriendLeaderboardCard.tsx
"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  leetcodeUsername: string;
  totalEasySubmissions: number;
  totalMediumSubmissions: number;
  totalHardSubmissions: number;
  score: number;
};

type LeaderboardResponse =
  | {
      success: true;
      topFive: LeaderboardEntry[];
      currentUser: LeaderboardEntry | null;
      totalParticipants: number;
    }
  | {
      success: false;
      message?: string;
    };

type FriendLeaderboardCardProps = {
  backend: string;
};

function TrophyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M8 3h8v3.2c0 3.2-1.7 5.8-4 5.8s-4-2.6-4-5.8V3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 5H4.5v1.5A4.5 4.5 0 0 0 9 11M16 5h3.5v1.5A4.5 4.5 0 0 1 15 11M12 12v4M8.5 21h7M10 16h4v5h-4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 px-3 pb-4">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="flex animate-pulse items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div className="h-7 w-7 rounded-full bg-white/[0.07]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.07]" />
            <div className="h-2.5 w-28 rounded bg-white/[0.04]" />
          </div>
          <div className="h-5 w-10 rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function rankClasses(rank: number) {
  if (rank === 1) {
    return "border-amber-400/25 bg-amber-400/[0.1] text-amber-300";
  }

  if (rank === 2) {
    return "border-zinc-300/20 bg-zinc-300/[0.08] text-zinc-300";
  }

  if (rank === 3) {
    return "border-orange-400/20 bg-orange-400/[0.08] text-orange-300";
  }

  return "border-white/[0.08] bg-white/[0.03] text-zinc-500";
}

export default function FriendLeaderboardCard({
  backend,
}: FriendLeaderboardCardProps) {
  const [topFive, setTopFive] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${backend}/api/leaderboard/friends`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({
          success: false,
          message: "Invalid response from server",
        }))) as LeaderboardResponse;

        if (!res.ok || !data.success) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Failed to load leaderboard",
          );
        }

        if (!ignore) {
          setTopFive(Array.isArray(data.topFive) ? data.topFive : []);
          setCurrentUser(data.currentUser ?? null);
          setTotalParticipants(data.totalParticipants ?? 0);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load leaderboard",
          );
          setTopFive([]);
          setCurrentUser(null);
          setTotalParticipants(0);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadLeaderboard();

    return () => {
      ignore = true;
    };
  }, [backend]);

  const currentUserIsTopFive = currentUser
    ? topFive.some((entry) => entry.userId === currentUser.userId)
    : false;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111214] shadow-[0_14px_45px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/[0.07] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Friend leaderboard
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              All-time weighted solved score.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-300">
            <TrophyIcon />
            {totalParticipants}
          </div>
        </div>
      </div>

      <div className="py-4">
        {loading ? <LoadingRows /> : null}

        {!loading && error ? (
          <div className="mx-4 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-3.5 py-3">
            <p className="text-xs font-medium text-red-300">
              Unable to load leaderboard
            </p>
            <p className="mt-1 text-xs leading-5 text-red-300/65">{error}</p>
          </div>
        ) : null}

        {!loading && !error && topFive.length === 0 ? (
          <div className="px-5 py-7 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-500">
              <TrophyIcon />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-300">
              No rankings yet
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Synced friends will appear here once stats are available.
            </p>
          </div>
        ) : null}

        {!loading && !error && topFive.length > 0 ? (
          <div className="space-y-2 px-3">
            {topFive.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0d0e10] p-3 transition hover:border-emerald-500/15 hover:bg-emerald-500/[0.025]"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${rankClasses(entry.rank)}`}
                >
                  {entry.rank}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {entry.leetcodeUsername || "Unknown user"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {entry.totalEasySubmissions}E · {entry.totalMediumSubmissions}M · {entry.totalHardSubmissions}H
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-300">
                    {entry.score}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                    pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !error && currentUser && !currentUserIsTopFive ? (
          <div className="mx-3 mt-3 border-t border-white/[0.07] pt-3">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-xs font-semibold text-emerald-300">
                {currentUser.rank}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">
                  You · {currentUser.leetcodeUsername}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {currentUser.totalEasySubmissions}E · {currentUser.totalMediumSubmissions}M · {currentUser.totalHardSubmissions}H
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-emerald-300">
                  {currentUser.score}
                </p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                  pts
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}