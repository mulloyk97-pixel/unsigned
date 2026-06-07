"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoredProfile } from "@/lib/useProfile";
import { buildShortlist } from "@/lib/programs";
import SwipeDeck from "@/components/SwipeDeck";

export default function DiscoverPage() {
  const router = useRouter();
  const profile = useStoredProfile();

  useEffect(() => {
    if (profile === null) router.replace("/intake");
  }, [profile, router]);

  const matches = useMemo(() => (profile ? buildShortlist(profile) : []), [profile]);

  if (!profile) {
    return <p className="text-muted">Finding your fits…</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <h1 className="font-head text-2xl font-bold text-fg">Nothing for your sport yet.</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg">
          We launched with D-III basketball. We&apos;d rather show you nothing than fake a list —
          more sports land as we verify real programs.
        </p>
        <Link href="/intake" className="mt-3 inline-block text-sm font-medium text-accent">
          Change my sport →
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
