"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoredProfile } from "@/lib/useProfile";
import { buildShortlist } from "@/lib/programs";
import { savedSchools, useSavedSchools } from "@/lib/saved";
import { Pill, SchoolReport, VerifiedBadge, scoreColor, shortDivision } from "@/components/SchoolReport";

export default function SavedPage() {
  const router = useRouter();
  const profile = useStoredProfile();
  const savedIds = useSavedSchools();
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (profile === null) router.replace("/build");
  }, [profile, router]);

  const saved = useMemo(() => {
    if (!profile) return [];
    const all = buildShortlist(profile, 1000);
    const set = new Set(savedIds);
    return all.filter((m) => set.has(m.program.id));
  }, [profile, savedIds]);

  if (!profile) return <p className="text-muted">Loading your list…</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-3xl font-bold tracking-tight text-fg">SAVED SCHOOLS</h1>
        <Link href="/discover" className="text-sm font-medium text-accent">Explore →</Link>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-6 text-center">
          <p className="text-sm text-muted">No schools saved yet — start exploring and tap ♥ on the ones you like.</p>
          <Link href="/discover" className="mt-3 inline-block text-sm font-medium text-accent">Go to Explore →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {saved.map((m) => {
            const open = openId === m.program.id;
            return (
              <div key={m.program.id} className="rounded-2xl bg-surface overflow-hidden">
                {open ? (
                  <SchoolReport match={m} profile={profile} expanded />
                ) : (
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-head text-lg font-bold leading-tight text-fg">{m.program.school}</h3>
                        <p className="text-xs text-muted mt-1">{m.program.city}, {m.program.state}</p>
                      </div>
                      <span className={`font-head text-2xl font-bold tnum ${scoreColor(m.fitScore)}`}>{m.fitScore}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill className="border-line bg-bg text-fg">{shortDivision(m.program.division)}</Pill>
                      <VerifiedBadge verified={m.program.coachVerified} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 border-t border-line p-3">
                  <button
                    onClick={() => setOpenId(open ? null : m.program.id)}
                    className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg active:scale-[0.99] transition"
                  >
                    {open ? "Hide report" : "View full report"}
                  </button>
                  <button
                    onClick={() => savedSchools.remove(m.program.id)}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
