"use client";

import { AthleteProfile, Program, ProgramMatch } from "@/lib/types";
import { SchoolPhoto } from "./SchoolPhoto";
import DraftIntro from "./DraftIntro";

export function shortDivision(d: Program["division"]): string {
  return d === "DIII" ? "D-III" : d;
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-accent";
  if (score >= 60) return "text-fg";
  return "text-muted";
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Pill className="border-success/30 bg-success/10 text-success normal-case">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Coach verified
    </Pill>
  ) : (
    <Pill className="border-line bg-surface text-muted normal-case">Coach unverified</Pill>
  );
}

function academicNote(profile: AthleteProfile, program: Program): string {
  const gap = profile.gpa - program.avgGpa;
  const base = `Avg admitted GPA ~${program.avgGpa.toFixed(1)}. Your ${profile.gpa.toFixed(2)}`;
  if (gap >= 0.1) return `${base} is in range — academics won't hold you back here.`;
  if (gap >= -0.3) return `${base} is close — admission is realistic but not a lock.`;
  return `${base} is below their bar. At D-III academics gate you, so treat this as an academic reach.`;
}

function financialNote(profile: AthleteProfile, program: Program): string {
  const net = (program.typicalNetCost / 1000).toFixed(0);
  if (profile.budgetPerYear <= 0)
    return `Typical net price ~$${net}k/yr. Add a family budget at intake for a sharper read.`;
  const budget = (profile.budgetPerYear / 1000).toFixed(0);
  if (program.typicalNetCost <= profile.budgetPerYear)
    return `Typical net ~$${net}k/yr fits inside your ~$${budget}k budget.`;
  if (program.typicalNetCost <= profile.budgetPerYear * 1.25)
    return `Typical net ~$${net}k/yr is a bit above your ~$${budget}k budget — worth asking about aid.`;
  return `Typical net ~$${net}k/yr is well above your ~$${budget}k budget — likely a stretch.`;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm text-fg mt-1 leading-relaxed">{children}</p>
    </div>
  );
}

// Feed-style scout card: full-bleed photo with the school name floating over a
// gradient scrim; fit + badges in a clean row below. No border.
export function SchoolReport({
  match,
  profile,
  expanded,
}: {
  match: ProgramMatch;
  profile: AthleteProfile;
  expanded: boolean;
}) {
  const { program, fitScore, why } = match;
  return (
    <div className="flex flex-col">
      <div className="relative h-80 w-full shrink-0">
        <SchoolPhoto name={program.school} photoUrl={program.photoUrl} className="h-full w-full" />
        {/* scrim: transparent -> surface so text reads and blends into content */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-surface via-surface/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-head text-3xl font-bold leading-none text-white">{program.school}</h3>
          <p className="mt-1.5 text-xs text-white/75">{program.conference} · {program.city}, {program.state}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-head text-4xl font-bold text-accent tnum leading-none">{fitScore}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted">fit</span>
          </div>
          <div className="flex items-center gap-2">
            <Pill className="border-line bg-bg text-fg">{shortDivision(program.division)}</Pill>
            <VerifiedBadge verified={program.coachVerified} />
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-fg/90">{why}</p>

        {expanded && (
          <div className="mt-1 flex flex-col gap-4 border-t border-line pt-4">
            <p className="text-sm leading-relaxed text-muted">{program.blurb}</p>
            <Detail label="Academic fit">{academicNote(profile, program)}</Detail>
            <Detail label="Financial fit">{financialNote(profile, program)}</Detail>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">Highlight clips</p>
              <div className="rounded-lg bg-bg p-3 text-center text-xs text-muted">
                Film breakdowns are coming. For now, lead with your own clips when you reach out.
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">Coach contact</p>
              {program.coachVerified ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg bg-bg p-3">
                    <p className="text-[11px] uppercase tracking-wide text-success">Verified</p>
                    {program.coachName && <p className="text-sm font-medium text-fg mt-1">{program.coachName}</p>}
                    {program.coachEmail && (
                      <a href={`mailto:${program.coachEmail}`} className="text-sm text-accent underline break-all">
                        {program.coachEmail}
                      </a>
                    )}
                  </div>
                  <DraftIntro profile={profile} program={program} />
                </div>
              ) : (
                <p className="text-sm text-muted">Coach contact not yet verified.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
