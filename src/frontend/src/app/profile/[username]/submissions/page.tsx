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
        "rounded-3xl border border-white/10",
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

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}

function ErrorState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 text-sm text-red-300">
      {children}
    </div>
  );
}

function lerp(start: number, end: number, amount: number) {
  return Math.round(start + (end - start) * amount);
}

function getTagRankColor(index: number, total: number) {
  const start = { r: 16, g: 185, b: 129 }; // emerald #10b981
  const end = { r: 251, g: 113, b: 133 }; // rose #fb7185

  const amount = total <= 1 ? 0 : index / (total - 1);

  const r = lerp(start.r, end.r, amount);
  const g = lerp(start.g, end.g, amount);
  const b = lerp(start.b, end.b, amount);

  return `rgb(${r}, ${g}, ${b})`;
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
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <PanelCard className="p-6 text-sm text-zinc-300">Loading…</PanelCard>
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <PanelCard className="p-6">
          <div className="text-lg font-semibold text-white">
            Submission analytics is private
          </div>

          <div className="mt-2 text-sm text-zinc-400">
            You can only view submission analysis for your own profile.
          </div>

          <div className="mt-5">
            <Link
              href={`/profile/${encodeURIComponent(username)}`}
              className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.14]"
            >
              Back to profile
            </Link>
          </div>
        </PanelCard>
      </main>
    );
  }

  const tags = data && data.success === true ? data.tags ?? [] : [];
  const visibleTags = tags.slice(0, 30);
  const maxCount = Math.max(1, ...visibleTags.map((tag) => tag.acceptedCount));

  const stats = data && data.success === true ? data.stats : undefined;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="space-y-5">
        <PanelCard className="overflow-hidden">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%)]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300">
                  Submission Analysis
                </div>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Tag Strengths
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Based on accepted submissions from your stored submission
                  events.
                </p>
              </div>

              <Link
                href={`/profile/${encodeURIComponent(username)}`}
                className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:bg-white/[0.07]"
              >
                Back to profile
              </Link>
            </div>
          </div>
        </PanelCard>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Unique solved"
            value={stats?.uniqueAcceptedProblemsCount ?? "—"}
            hint="Accepted problems"
          />

          <StatCard
            label="Accepted"
            value={stats?.acceptedSubmissionsCount ?? "—"}
            hint="Submissions"
          />

          <StatCard label="Tags" value={tags.length || "—"} hint="Tracked" />
        </div>

        <PanelCard className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Top Tags
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Your strongest tags by accepted count.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
              Showing {visibleTags.length}
              {tags.length > visibleTags.length ? ` of ${tags.length}` : ""}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {loadingData ? (
              <EmptyState>Loading tag strengths…</EmptyState>
            ) : !data ? (
              <EmptyState>No data yet.</EmptyState>
            ) : data.success === false ? (
              <ErrorState>{data.message ?? "Failed to load."}</ErrorState>
            ) : visibleTags.length === 0 ? (
              <EmptyState>No accepted submissions found yet.</EmptyState>
            ) : (
              <div className="space-y-4">
                {visibleTags.map((tag, idx) => {
                  const width = Math.round((tag.acceptedCount / maxCount) * 100);
                  const tone = getTagRankColor(idx, visibleTags.length);

                  return (
                    <div key={tag.tag}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-zinc-100">
                          {tag.tag}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400">
                          {tag.acceptedCount}
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: tone,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {tags.length > visibleTags.length && (
                  <div className="pt-2 text-xs text-zinc-500">
                    Showing top {visibleTags.length} tags.
                  </div>
                )}
              </div>
            )}
          </div>
        </PanelCard>
      </div>
    </main>
  );
}