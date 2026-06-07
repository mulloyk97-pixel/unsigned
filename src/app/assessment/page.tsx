"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoredProfile } from "@/lib/useProfile";
import { buildAssessment } from "@/lib/assessment";
import { DIVISION_LABEL } from "@/lib/types";

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
          The straight version.
        </h1>
      </div>

      {/* Blunt verdict up top */}
      <div className="rounded-xl border-2 border-ink bg-card p-5">
        <p className="text-[15px] leading-relaxed text-ink">{assessment.verdict}</p>
      </div>

      {/* Realistic divisions */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Realistic divisions
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {assessment.athletic.realistic.map((d) => (
            <span
              key={d}
              className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
            >
              {DIVISION_LABEL[d]}
            </span>
          ))}
        </div>
      </div>

      {/* Athletic fit */}
      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Athletic fit
        </h2>
        <p className="mt-2 text-[15px] font-semibold text-ink">
          {assessment.athletic.headline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {assessment.athletic.detail}
        </p>
        {assessment.athletic.reach && (
          <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2.5 text-sm text-warn">
            <span className="font-semibold">Reach check: </span>
            {assessment.athletic.reach}
          </p>
        )}
      </section>

      {/* Academic fit */}
      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Academic fit
        </h2>
        <p className="mt-2 text-[15px] font-semibold text-ink">
          {assessment.academic.headline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {assessment.academic.detail}
        </p>
      </section>

      <Link
        href="/shortlist"
        className="rounded-xl bg-ink px-5 py-4 text-center font-semibold text-paper active:scale-[0.99] transition"
      >
        Show my right-fit programs
      </Link>
      <Link href="/intake" className="text-center text-sm text-muted underline">
        Edit my info
      </Link>
    </div>
  );
}
