// components/profile/BadgesSection.tsx
import Image from "next/image";
import type { Badge, UpcomingBadge } from "@/types/leetnode";

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
        "overflow-hidden rounded-3xl border border-white/10",
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

function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h3>

        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

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
        "group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition",
        locked ? "opacity-70" : "hover:border-emerald-400/20 hover:bg-white/[0.055]",
      ].join(" ")}
    >
      <div
        className={[
          "relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]",
          locked ? "grayscale" : "",
        ].join(" ")}
      >
        <Image src={icon} alt={name} fill sizes="44px" className="object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-sm font-semibold text-zinc-100">
            {name}
          </div>

          <div
            className={[
              "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              locked
                ? "border-white/10 bg-white/[0.04] text-zinc-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
            ].join(" ")}
          >
            {locked ? "Locked" : "Earned"}
          </div>
        </div>

        {meta ? <div className="mt-1 text-xs text-zinc-500">{meta}</div> : null}
      </div>
    </div>
  );
}

function EmptyBadgeState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
      {children}
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
    <PanelCard className="h-full">
      <SectionTitle
        title="Badges"
        subtitle="Earned badges and upcoming challenges."
        right={
          activeBadgeId ? (
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Active badge: {activeBadgeId}
            </div>
          ) : undefined
        }
      />

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            Earned
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {earned.length ? (
              earned.slice(0, 4).map((b) => (
                <BadgeTile
                  key={b.id}
                  name={b.displayName}
                  icon={b.icon}
                  meta={`Earned on ${b.creationDate}`}
                  locked={false}
                />
              ))
            ) : (
              <EmptyBadgeState>No earned badges yet.</EmptyBadgeState>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Upcoming
            </div>

            {upcoming.length > 4 ? (
              <div className="text-xs text-zinc-500">
                Showing 4 of {upcoming.length}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {upcoming.length ? (
              upcoming.slice(0, 4).map((b) => (
                <BadgeTile
                  key={b.name}
                  name={b.name}
                  icon={b.icon}
                  meta="Complete the challenge to unlock"
                  locked
                />
              ))
            ) : (
              <EmptyBadgeState>No upcoming badges.</EmptyBadgeState>
            )}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}