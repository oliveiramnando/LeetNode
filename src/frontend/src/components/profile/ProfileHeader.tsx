// components/profile/ProfileHeader.tsx
import Image from "next/image";
import type { MatchedUser } from "@/types/leetnode";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Stat } from "@/components/ui/Stat";

export function ProfileHeader({ user }: { user: MatchedUser }) {
  const p = user.profile;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {/* next/image remote requires config; this still works in dev if configured.
                If you don’t want remotePatterns right now, swap to <img>. */}
            <Image
              src={p.userAvatar}
              alt={`${user.username} avatar`}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-white">{p.realName || user.username}</h1>
              <Pill className="text-[11px]">@{user.username}</Pill>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
              {user.githubUrl ? (
                <a
                  className="hover:text-white/90 underline underline-offset-2"
                  href={user.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              ) : (
                <span className="text-white/40">No GitHub linked</span>
              )}
              <span className="text-white/30">•</span>
              <span>{p.school ?? "School not set"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill tone="info">⭐ {p.starRating}</Pill>
          <Pill>Reputation: {p.reputation}</Pill>
          <Pill>Ranking: {p.ranking.toLocaleString()}</Pill>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Contribution Points" value={user.contributions.points} />
        <Stat label="Questions" value={user.contributions.questionCount} />
        <Stat label="Testcases" value={user.contributions.testcaseCount} />
      </CardContent>
    </Card>
  );
}
