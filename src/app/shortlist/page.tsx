"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoredProfile } from "@/lib/useProfile";
import { buildAssessment } from "@/lib/assessment";
import { buildShortlist } from "@/lib/programs";
import ProgramCard from "@/components/ProgramCard";

export default function ShortlistPage() {
  const router = useRouter();
  const profile = useStoredProfile();

  useEffect(() => {
    if (profile === null) router.replace("/intake");
  }, [profile, router]);

  const matches = useMemo(() => {
    if (!profile) return [];
    const assessment = buildAssessment(profile);
    return buildShortlist(profile, assessment.matchDivisions);
  }, [profile]);

  if (!profile) {
    return <p className="text-muted">Building your shortlist…</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-accent">{matches.length} right-fit programs</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Programs that fit you — start here.
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Ranked by fit across your level, grades, budget, and location. These
          are places that will actually look at you. Start with the top one.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-line bg-card p-5">
          <p className="text-sm text-ink">
            We don&apos;t have enough programs for your sport in our launch
            dataset yet. That&apos;s on us — we&apos;d rather show you nothing
            than fake a list. Check back as we add schools.
          </p>
          <Link href="/intake" className="mt-3 inline-block text-sm text-accent underline">
            Edit my info
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match, i) => (
            <ProgramCard
              key={match.program.id}
              match={match}
              profile={profile}
              rank={i + 1}
              defaultExpanded={i === 0}
            />
          ))}
        </div>
      )}

      <Link
        href="/assessment"
        className="text-center text-sm text-muted underline"
      >
        Back to my assessment
      </Link>
    </div>
  );
}
