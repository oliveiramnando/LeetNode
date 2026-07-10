// components/profile/ProfileHeader.tsx
import Image from "next/image";
import type React from "react";

import type { MatchedUser } from "@/types/leetnode";
import { Pill } from "@/components/ui/Pill";
import { Stat } from "@/components/ui/Stat";

export function ProfileHeader({
  user,
  heroAction,
}: {
  user: MatchedUser;
  heroAction?: React.ReactNode;
}) {
  const p = user.profile;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
              <Image
                src={p.userAvatar}
                alt={`${user.username} avatar`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                  {p.realName || user.username}
                </h1>

                <Pill className="border-white/10 bg-white/[0.04] text-[11px] text-zinc-300">
                  @{user.username}
                </Pill>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                {user.githubUrl ? (
                  <a
                    className="font-medium text-emerald-300 underline underline-offset-4 transition hover:text-emerald-200"
                    href={user.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                ) : (
                  <span className="text-zinc-500">No GitHub linked</span>
                )}

                <span className="text-zinc-700">•</span>

                <span>{p.school ?? "School not set"}</span>
              </div>

              {heroAction ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {heroAction}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Pill className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              ⭐ {p.starRating}
            </Pill>

            <Pill className="border-white/10 bg-white/[0.04] text-zinc-300">
              Reputation: {p.reputation}
            </Pill>

            <Pill className="border-white/10 bg-white/[0.04] text-zinc-300">
              Ranking: {p.ranking.toLocaleString()}
            </Pill>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-5 sm:grid-cols-3 sm:p-6">
        <Stat label="Contribution Points" value={user.contributions.points} />
        <Stat label="Questions" value={user.contributions.questionCount} />
        <Stat label="Testcases" value={user.contributions.testcaseCount} />
      </div>
    </section>
  );
}