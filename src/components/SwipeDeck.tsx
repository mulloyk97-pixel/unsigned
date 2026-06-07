"use client";

import { useRef, useState } from "react";
import { AthleteProfile, Program, ProgramMatch } from "@/lib/types";
import { SchoolPhoto } from "./SchoolPhoto";
import DraftIntro from "./DraftIntro";

const SWIPE_THRESHOLD = 110;

function shortDivision(d: Program["division"]): string {
  return d === "DIII" ? "D-III" : d;
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
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

// Scout-report card: full-width photo, then content with clear hierarchy.
function CardFace({
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
      <div className="relative w-full aspect-video">
        <SchoolPhoto name={program.school} photoUrl={program.photoUrl} className="h-full w-full" />
        <span className="absolute top-3 left-3">
          <Pill className="border-line bg-bg/80 text-fg backdrop-blur">{shortDivision(program.division)}</Pill>
        </span>
        <span className="absolute top-3 right-3">
          {/* PLACEHOLDER record — display only, needs enrichment */}
          <Pill className="border-line bg-bg/80 text-muted backdrop-blur normal-case">
            {program.winLossLastSeason ? `${program.winLossLastSeason} last yr` : "record TBD"}
          </Pill>
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-head text-xl font-bold leading-tight text-fg">{program.school}</h3>
            <p className="text-xs text-muted mt-1">
              {program.conference} · {program.city}, {program.state}
            </p>
          </div>
          <div className="text-right shrink-0 leading-none">
            <span className="font-head text-4xl font-bold text-accent tnum">{fitScore}</span>
            <p className="text-[10px] uppercase tracking-wide text-muted mt-0.5">Fit score</p>
          </div>
        </div>

        <VerifiedBadge verified={program.coachVerified} />

        <p className="text-sm leading-relaxed text-fg/90">{why}</p>

        {expanded && (
          <div className="mt-1 flex flex-col gap-4 border-t border-line pt-4">
            <p className="text-sm leading-relaxed text-muted">{program.blurb}</p>

            <Detail label="Academic fit">{academicNote(profile, program)}</Detail>
            <Detail label="Financial fit">{financialNote(profile, program)}</Detail>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">Highlight clips</p>
              <div className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-muted">
                Film breakdowns are coming. For now, lead with your own clips when you reach out.
              </div>
            </div>

            {program.coachVerified ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-line bg-bg p-3">
                  <p className="text-[11px] uppercase tracking-wide text-success">Coach contact · verified</p>
                  <p className="text-sm font-medium text-fg mt-1">{program.coachName}</p>
                  {program.coachEmail && (
                    <a href={`mailto:${program.coachEmail}`} className="text-sm text-accent underline break-all">
                      {program.coachEmail}
                    </a>
                  )}
                </div>
                <DraftIntro profile={profile} program={program} />
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-bg p-3">
                <p className="text-sm text-fg">Coach contact coming soon.</p>
                <p className="text-xs text-muted mt-1">
                  We only show contacts we&apos;ve confirmed — no guesses. Until then, save it and
                  find the staff yourself:
                </p>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `${program.school} ${profile.sport.includes("womens") ? "women's" : "men's"} basketball coaching staff`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-accent"
                >
                  Find the coaching staff →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm text-fg mt-1 leading-relaxed">{children}</p>
    </div>
  );
}

// --- the swipe deck --------------------------------------------------------

export default function SwipeDeck({
  matches,
  profile,
}: {
  matches: ProgramMatch[];
  profile: AthleteProfile;
}) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<ProgramMatch[]>([]);
  const [expanded, setExpanded] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);

  const startX = useRef(0);
  const moved = useRef(false);

  const current = matches[index];
  const next = matches[index + 1];
  const done = index >= matches.length;

  function commit(dir: "left" | "right") {
    if (leaving) return;
    setLeaving(dir);
  }

  function finalize() {
    if (!leaving) return;
    if (leaving === "right" && current) setSaved((s) => [...s, current]);
    setLeaving(null);
    setDx(0);
    setExpanded(false);
    setIndex((i) => i + 1);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (leaving) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || leaving) return;
    const ndx = e.clientX - startX.current;
    if (Math.abs(ndx) > 6) moved.current = true;
    setDx(ndx);
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      commit(dx > 0 ? "right" : "left");
    } else {
      if (!moved.current) setExpanded((x) => !x);
      setDx(0);
    }
  }

  if (done) {
    return <SavedList saved={saved} profile={profile} total={matches.length} />;
  }

  const transform = leaving
    ? `translateX(${leaving === "right" ? "120%" : "-120%"}) rotate(${leaving === "right" ? 14 : -14}deg)`
    : `translateX(${dx}px) rotate(${dx * 0.04}deg)`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted tnum">{index + 1} / {matches.length}</span>
        <span className="font-semibold text-accent tnum">{saved.length} saved</span>
      </div>

      <div className="relative h-[470px]">
        {next && <div className="absolute inset-x-2 top-2 bottom-0 rounded-xl border border-line bg-surface/60 scale-[0.97]" />}

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onTransitionEnd={finalize}
          style={{ transform, transition: dragging ? "none" : "transform 0.32s ease" }}
          className="absolute inset-0 overflow-y-auto rounded-xl border border-line bg-surface no-scrollbar touch-pan-y select-none"
        >
          <span
            className="pointer-events-none absolute top-5 right-5 z-10 rounded-lg border-2 border-success px-3 py-1 text-base font-bold uppercase text-success rotate-12"
            style={{ opacity: dx > 0 ? Math.min(dx / SWIPE_THRESHOLD, 1) : 0 }}
          >
            Save
          </span>
          <span
            className="pointer-events-none absolute top-5 left-5 z-10 rounded-lg border-2 border-danger px-3 py-1 text-base font-bold uppercase text-danger -rotate-12"
            style={{ opacity: dx < 0 ? Math.min(-dx / SWIPE_THRESHOLD, 1) : 0 }}
          >
            Pass
          </span>

          {current && <CardFace match={current} profile={profile} expanded={expanded} />}
        </div>
      </div>

      <p className="text-center text-xs text-muted">Tap for the full report · swipe or use the buttons</p>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => commit("left")}
          aria-label="Pass"
          className="h-16 w-16 rounded-full border border-line bg-surface text-2xl text-danger active:scale-95 transition"
        >
          ✕
        </button>
        <button
          onClick={() => commit("right")}
          aria-label="Save"
          className="h-16 w-16 rounded-full bg-accent text-2xl text-bg active:scale-95 transition"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

// --- saved list ------------------------------------------------------------

function SavedList({
  saved,
  profile,
  total,
}: {
  saved: ProgramMatch[];
  profile: AthleteProfile;
  total: number;
}) {
  if (saved.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-head text-2xl font-bold text-fg">You passed on all {total}.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Being picky is fine — but these were the schools most likely to actually recruit you.
            Take another run with an open mind.
          </p>
        </div>
        <a href="/discover" className="rounded-lg bg-accent px-5 py-3.5 text-center font-semibold text-bg active:scale-[0.99] transition">
          Start over
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent tnum">Your list · {saved.length}</p>
        <h1 className="mt-1 font-head text-3xl font-bold tracking-tight text-fg">Schools you saved</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Reach out to verified coaches with the draft below. We won&apos;t hand you a contact we
          haven&apos;t confirmed.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {saved.map((match) => (
          <div key={match.program.id} className="rounded-xl border border-line bg-surface overflow-hidden">
            <CardFace match={match} profile={profile} expanded={true} />
          </div>
        ))}
      </div>

      <a href="/discover" className="text-center text-sm font-medium text-accent">
        Swipe through the rest again
      </a>
    </div>
  );
}
