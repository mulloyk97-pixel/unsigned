"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoredProfile } from "@/lib/useProfile";
import { hydrateProfile } from "@/lib/onboarding";
import { buildShortlist } from "@/lib/programs";
import { AthleteProfile } from "@/lib/types";
import SwipeDeck from "@/components/SwipeDeck";

export default function DiscoverPage() {
  const router = useRouter();
  const stored = useStoredProfile(); // undefined (loading) | null | profile
  const [hydrated, setHydrated] = useState<AthleteProfile | null | undefined>(undefined);

  // Returning users have no local profile — rebuild it from athlete_profiles.
  useEffect(() => {
    if (stored !== null) return;
    let cancelled = false;
    (async () => {
      const p = await hydrateProfile();
      if (cancelled) return;
      if (p) setHydrated(p);
      else {
        setHydrated(null);
        router.replace("/build");
      }
    })();
    return () => { cancelled = true; };
  }, [stored, router]);

  const profile = stored ?? hydrated;
  const matches = useMemo(() => (profile ? buildShortlist(profile) : []), [profile]);

  if (!profile) return <p className="text-muted">Finding your fits…</p>;

  if (matches.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-5">
        <h1 className="font-head text-2xl font-bold text-fg">Nothing for your sport yet.</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg">
          We launched with D-III basketball. We&apos;d rather show you nothing than fake a list —
          more sports land as we verify real programs.
        </p>
        <Link href="/build" className="mt-3 inline-block text-sm font-medium text-accent">
          Update my card →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-head text-3xl font-bold tracking-tight text-fg">FIND YOUR FIT</h1>
        <p className="mt-1 text-[15px] text-muted">
          Right-fit programs, one at a time. Save the ones you want — pass on the rest.
        </p>
      </div>
      <SwipeDeck matches={matches} profile={profile} />
    </div>
  );
}
