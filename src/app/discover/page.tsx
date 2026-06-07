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

  const matches = useMemo(
    () => (profile ? buildShortlist(profile) : []),
    [profile],
  );

  if (!profile) {
    return <p className="text-muted">Finding your schools…</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-line bg-card p-5">
          <h1 className="text-lg font-semibold text-ink">No schools for your sport yet.</h1>
          <p className="mt-2 text-sm text-ink">
            Our launch dataset is D-III basketball first. We&apos;d rather show you nothing than fake
            a list — more sports are coming as we verify real programs and contacts.
          </p>
          <Link href="/intake" className="mt-3 inline-block text-sm text-accent underline">
            Change my sport
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Find your fit.</h1>
        <p className="mt-1 text-[15px] text-muted">
          Right-fit programs, one at a time. Save the ones you like — pass on the rest.
        </p>
      </div>
      <SwipeDeck matches={matches} profile={profile} />
    </div>
  );
}
