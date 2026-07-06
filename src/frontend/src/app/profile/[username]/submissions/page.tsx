// src/frontend/src/app/profile/[username]/submissions/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MeResponse =
  | { loggedIn: false }
  | {
      loggedIn: true;
      user: {
        id: string;
        leetcodeUsername?: string | null;
        leetcodeUsernameLower?: string | null;
      };
    };

type TagStrengthsResponse =
  | { success: false; message?: string }
  | {
      success: true;
      tags: Array<{ tag: string; acceptedCount: number }>;
      stats?: {
        acceptedSubmissionsCount?: number;
        uniqueAcceptedProblemsCount?: number;
        lastUpdated?: string;
      };
    };

function normalizeLc(username: string) {
  return String(username || "").trim().toLowerCase();
}

export default function SubmissionsAnalyticsPage({
  params,
}: {
  params: { username: string };
}) {
  const username = params?.username ?? "";
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [data, setData] = useState<TagStrengthsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadMe() {
      try {
        const res = await fetch(`${backend}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = (await res.json()) as MeResponse;

        if (!alive) return;
        setMe(json);
      } catch {
        if (!alive) return;
        setMe({ loggedIn: false });
      } finally {
        if (!alive) return;
        setLoadingMe(false);
      }
    }

    loadMe();

    return () => {
      alive = false;
    };
  }, [backend]);

  const isOwner = useMemo(() => {
    if (!me || me.loggedIn === false) return false;

    const viewer = normalizeLc(
      me.user.leetcodeUsernameLower ?? me.user.leetcodeUsername ?? ""
    );

    return viewer.length > 0 && viewer === normalizeLc(username);
  }, [me, username]);

  useEffect(() => {
    if (loadingMe) return;

    if (!isOwner) {
      setData(null);
      setLoadingData(false);
      return;
    }

    let alive = true;

    setLoadingData(true);

    async function loadTagStrengths() {
      try {
        const res = await fetch(`${backend}/api/submissions/strengths`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = (await res.json()) as TagStrengthsResponse;

        if (!alive) return;
        setData(json);
      } catch (e: unknown) {
        if (!alive) return;

        const message =
          e instanceof Error ? e.message : "Failed to load tag strengths.";

        setData({ success: false, message });
      } finally {
        if (!alive) return;
        setLoadingData(false);
      }
    }

    loadTagStrengths();

    return () => {
      alive = false;
    };
  }, [backend, loadingMe, isOwner]);

  if (loadingMe) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading…
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Submission analytics is private
          </div>

          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You can only view submission analysis for your own profile.
          </div>

          <div className="mt-4">
            <Link
              href={`/profile/${encodeURIComponent(username)}`}
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
            >
              Back to profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tags =
    data && "success" in data && data.success === true ? data.tags ?? [] : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Submission Analysis
            </div>

            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Tag Strengths
            </div>

            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Based on accepted submissions from your stored submission events.
            </div>
          </div>

          <Link
            href={`/profile/${encodeURIComponent(username)}`}
            className="mt-1 text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
          >
            Back to profile
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          {loadingData ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading tag strengths…
            </div>
          ) : !data ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              No data yet.
            </div>
          ) : "success" in data && data.success === false ? (
            <div className="text-sm text-red-600">
              {data.message ?? "Failed to load."}
            </div>
          ) : tags.length === 0 ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              No accepted submissions found yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tags.slice(0, 30).map((t) => (
                <div
                  key={t.tag}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-900"
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">
                    {t.tag}
                  </div>

                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t.acceptedCount}
                  </div>
                </div>
              ))}

              {tags.length > 30 && (
                <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Showing top 30 tags.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}