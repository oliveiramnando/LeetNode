// src/frontend/src/components/feed/FriendStreaksCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type StreakUser = {
  _id: string;
  leetcodeUsername?: string;
};

type FriendStreak = {
  _id: string;
  users: StreakUser[];
  pairKey: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
};

type StreakResponse =
  | {
      success: true;
      streaks: FriendStreak[];
    }
  | {
      success: false;
      message?: string;
    };

type FriendStreaksCardProps = {
  backend: string;
  currentUserId: string;
};

function FlameIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M13.7 2.7c.5 3.2-.8 4.5-2 5.7-1 1-1.8 1.8-1.5 3.5.7-.5 1.2-1.2 1.5-2.1 2.4 1.6 3.8 3.7 3.8 6.1a3.5 3.5 0 0 1-7 0c0-1.5.7-2.8 1.8-3.8-2.9.8-4.8 3.1-4.8 6A6.5 6.5 0 0 0 12 24a6.5 6.5 0 0 0 6.5-6.5c0-5.2-3.1-9.9-4.8-14.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 px-4 pb-4">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="flex animate-pulse items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div className="h-9 w-9 rounded-full bg-white/[0.07]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.07]" />
            <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
          </div>
          <div className="h-5 w-8 rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export default function FriendStreaksCard({
  backend,
  currentUserId,
}: FriendStreaksCardProps) {
  const [streaks, setStreaks] = useState<FriendStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadStreaks() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${backend}/api/feed/streaks`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({
          success: false,
          message: "Invalid response from server",
        }))) as StreakResponse;

        if (!res.ok || !data.success) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Failed to load streaks",
          );
        }

        if (!ignore) {
          setStreaks(Array.isArray(data.streaks) ? data.streaks : []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load streaks",
          );
          setStreaks([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadStreaks();

    return () => {
      ignore = true;
    };
  }, [backend]);

  const friendStreaks = useMemo(
    () =>
      streaks.map((streak) => {
        const friend =
          streak.users.find((user) => user._id !== currentUserId) ??
          streak.users[0];

        return {
          ...streak,
          friend,
        };
      }),
    [streaks, currentUserId],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111214] shadow-[0_14px_45px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/[0.07] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Friend streaks
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Both solve each day to keep it alive.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-300">
            <FlameIcon />
            {friendStreaks.length}
          </div>
        </div>
      </div>

      <div className="max-h-[calc(100vh-11rem)] overflow-y-auto overscroll-contain py-4">
        {loading ? <LoadingRows /> : null}

        {!loading && error ? (
          <div className="mx-4 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-3.5 py-3">
            <p className="text-xs font-medium text-red-300">
              Unable to load streaks
            </p>
            <p className="mt-1 text-xs leading-5 text-red-300/65">{error}</p>
          </div>
        ) : null}

        {!loading && !error && friendStreaks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-500">
              <FlameIcon />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-300">
              No streaks yet
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Mutual followers will appear here once a streak is created.
            </p>
          </div>
        ) : null}

        {!loading && !error && friendStreaks.length > 0 ? (
          <div className="space-y-2 px-3">
            {friendStreaks.map((streak) => {
              const username =
                streak.friend?.leetcodeUsername || "Unknown user";
              const initial = username.charAt(0).toUpperCase();

              return (
                <div
                  key={streak._id}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0d0e10] p-3 transition hover:border-emerald-500/15 hover:bg-emerald-500/[0.025]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] text-sm font-medium text-emerald-300">
                    {initial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {username}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Best: {streak.longestStreak} days
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange-400/15 bg-orange-400/[0.07] px-2.5 py-1 text-sm font-semibold text-orange-300">
                    <FlameIcon />
                    {streak.currentStreak}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}