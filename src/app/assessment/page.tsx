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
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {profile.name}&apos;s honest read
        </p>
        <h1 className="mt-1 font-head text-3xl font-bold tracking-tight text-fg">
          STRAIGHT FROM A COACH WHO RESPECTS YOU.
        </h1>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-accent">
          What makes you a real recruit
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-fg">{assessment.strengths}</p>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Your honest challenge
        </h2>
        <p className="mt-2 font-head text-2xl font-semibold leading-snug text-fg">
          {assessment.challenge}
        </p>
      </section>

      <Link
        href="/discover"
        className="rounded-lg bg-accent px-5 py-4 text-center font-semibold text-bg active:scale-[0.99] transition"
      >
        Find schools that fit
      </Link>
      <Link href="/intake" className="text-center text-sm text-muted underline">
        Edit my info
      </Link>
    </div>
  );
}
