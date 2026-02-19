// components/profile/BadgesSection.tsx
import Image from "next/image";
import type { Badge, UpcomingBadge } from "@/types/leetnode";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Pill } from "@/components/ui/Pill";

function BadgeTile({
  name,
  icon,
  meta,
  locked = false,
}: {
  name: string;
  icon: string;
  meta?: string;
  locked?: boolean;
}) {
  return (
    <div
      className={[
        "group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition",
        locked ? "opacity-70" : "hover:bg-white/10",
      ].join(" ")}
    >
      <div className={["relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5", locked ? "grayscale" : ""].join(" ")}>
        <Image src={icon} alt={name} fill sizes="40px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium text-white/90">{name}</div>
          {locked ? <Pill className="shrink-0" tone="neutral">Locked</Pill> : <Pill className="shrink-0" tone="success">Earned</Pill>}
        </div>
        {meta ? <div className="mt-1 text-xs text-white/55">{meta}</div> : null}
      </div>
    </div>
  );
}

export function BadgesSection({
  badges,
  upcomingBadges,
  activeBadgeId,
}: {
  badges: Badge[];
  upcomingBadges: UpcomingBadge[];
  activeBadgeId?: string | null;
}) {
  const earned = badges ?? [];
  const upcoming = upcomingBadges ?? [];

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Badges"
          subtitle="Earned badges + upcoming challenges (locked)."
          right={activeBadgeId ? <Pill tone="info">Active badge: {activeBadgeId}</Pill> : undefined}
        />
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <div className="mb-2 text-xs font-semibold text-white/70">Earned</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {earned.length ? (
              earned.map((b) => (
                <BadgeTile
                  key={b.id}
                  name={b.displayName}
                  icon={b.icon}
                  meta={`Earned on ${b.creationDate}`}
                  locked={false}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/60">
                No earned badges yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold text-white/70">Upcoming</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {upcoming.length ? (
              upcoming.map((b) => (
                <BadgeTile key={b.name} name={b.name} icon={b.icon} meta="Complete the challenge to unlock" locked />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/60">
                No upcoming badges.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
