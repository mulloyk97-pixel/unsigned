"use client";

import { AthleteBrowse } from "@/lib/coachData";
import { STAT_META, StatKey } from "@/lib/athleteCard";

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export function AthletePhoto({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL / remote
    return <img src={photoUrl} alt="" className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface">
      <span className="font-head text-7xl font-bold text-muted/30">{initials(name)}</span>
    </div>
  );
}

// label-above-value, LinkedIn-style but dark
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-head text-2xl font-bold text-fg tnum leading-tight">{value || "—"}</p>
    </div>
  );
}

// Card stats: GPA, ACT, then the basketball trio.
const CARD_STATS: StatKey[] = ["gpa", "act", "ppg", "rpg", "apg"];

export function AthleteReport({ a, expanded }: { a: AthleteBrowse; expanded: boolean }) {
  const filledStats = (Object.keys(STAT_META) as StatKey[]).filter((k) => a.stats[k]);
  return (
    <div className="flex flex-col">
      <div className="relative h-80 w-full shrink-0">
        <AthletePhoto name={a.name} photoUrl={a.photoUrl} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-surface via-surface/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-head text-3xl font-bold leading-none text-white">{a.name}</h3>
          <p className="mt-1.5 text-xs text-white/75">
            {[a.position, a.gradYear && `Class of ${a.gradYear}`, a.highSchool, a.state].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {CARD_STATS.map((k) => (
            <Stat key={k} label={STAT_META[k].label} value={a.stats[k]} />
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19" /></svg>
          {a.clipCount} {a.clipCount === 1 ? "clip" : "clips"}
        </div>

        {expanded && (
          <div className="border-t border-line pt-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Full profile</p>
            {filledStats.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {filledStats.map((k) => <Stat key={k} label={STAT_META[k].label} value={a.stats[k]} />)}
              </div>
            ) : (
              <p className="text-sm text-muted">This athlete hasn&apos;t filled in stats yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
