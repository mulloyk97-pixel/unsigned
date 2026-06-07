"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoredProfile } from "@/lib/useProfile";
import { buildAssessment } from "@/lib/assessment";

export default function AssessmentPage() {
  const router = useRouter();
  const profile = useStoredProfile();

  useEffect(() => {
    if (profile === null) router.replace("/intake");
  }, [profile, router]);

  const assessment = useMemo(
    () => (profile ? buildAssessment(profile) : null),
    [profile],
  );

  if (!profile || !assessment) {
    return <p className="text-muted">Reading your profile…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-accent">{profile.name}&apos;s honest read</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Straight from a coach who respects you.
        </h1>
      </div>

      <section className="rounded-xl border-2 border-accent bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-accent">
          What makes you a real recruit
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{assessment.strengths}</p>
      </section>

      <section className="rounded-xl border-2 border-ink bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Your honest challenge
        </h2>
        <p className="mt-2 text-lg font-semibold leading-snug text-ink">{assessment.challenge}</p>
      </section>

      <Link
        href="/discover"
        className="rounded-xl bg-ink px-5 py-4 text-center font-semibold text-paper active:scale-[0.99] transition"
      >
        Find schools that fit
      </Link>
      <Link href="/intake" className="text-center text-sm text-muted underline">
        Edit my info
      </Link>
    </div>
  );
}
