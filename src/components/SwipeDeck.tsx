"use client";

import { useRef, useState } from "react";
import { AthleteProfile, Program, ProgramMatch } from "@/lib/types";
import { SchoolPhoto } from "./SchoolPhoto";
import DraftIntro from "./DraftIntro";

const SWIPE_THRESHOLD = 110;

// --- small presentational helpers -----------------------------------------

function shortDivision(d: Program["division"]): string {
  return d === "DIII" ? "D-III" : d;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-accent";
  if (score >= 60) return "text-ink";
  return "text-muted";
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
      ✓ Coach verified
    </span>
  ) : (
    <span className="rounded-full bg-line/60 px-2.5 py-1 text-xs font-medium text-muted">
      Coach unverified
    </span>
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

// Visual content of a school card, shared by the deck and the saved list.
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
      <div className="relative h-44 w-full">
        <SchoolPhoto name={program.school} photoUrl={program.photoUrl} className="h-44 w-full" />
        <span className="absolute top-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-paper">
          {shortDivision(program.division)}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-medium text-ink">
          {/* PLACEHOLDER record — needs enrichment, display only */}
          {program.winLossLastSeason ? `${program.winLossLastSeason} last yr` : "record TBD"}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink leading-tight">{program.school}</h3>
            <p className="text-xs text-muted mt-0.5">
              {program.conference} · {program.city}, {program.state}
            </p>
          </div>
          <span className={`text-lg font-bold shrink-0 ${scoreColor(fitScore)}`}>
            {fitScore}
            <span className="text-[10px] font-normal text-muted">/100</span>
          </span>
        </div>

        <VerifiedBadge verified={program.coachVerified} />

        <p className="text-sm text-ink mt-1">{why}</p>

        {expanded && (
          <div className="mt-2 flex flex-col gap-3 border-t border-line pt-3">
            <p className="text-sm text-muted leading-relaxed">{program.blurb}</p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Academic fit</p>
              <p className="text-sm text-ink mt-1">{academicNote(profile, program)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Financial fit</p>
              <p className="text-sm text-ink mt-1">{financialNote(profile, program)}</p>
            </div>

            {program.coachVerified ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg bg-paper border border-line p-3">
                  <p className="text-xs text-muted">Coach contact (verified)</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{program.coachName}</p>
                  {program.coachEmail && (
                    <a href={`mailto:${program.coachEmail}`} className="text-sm text-accent underline break-all">
                      {program.coachEmail}
                    </a>
                  )}
                </div>
                <DraftIntro profile={profile} program={program} />
              </div>
            ) : (
              <p className="rounded-lg bg-warn-soft px-3 py-2.5 text-sm text-warn">
                Coach contact isn&apos;t verified yet — we won&apos;t hand you an address we can&apos;t
                stand behind. Save it and we&apos;ll notify you when it&apos;s confirmed.
              </p>
            )}
          </div>
        )}
      </div>
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
    if (!leaving) return; // ignore snap-back transitions
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
    ? `translateX(${leaving === "right" ? "120%" : "-120%"}) rotate(${leaving === "right" ? 16 : -16}deg)`
    : `translateX(${dx}px) rotate(${dx * 0.04}deg)`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          {index + 1} of {matches.length}
        </span>
        <span className="font-medium text-accent">{saved.length} saved</span>
      </div>

      {/* card stack */}
      <div className="relative h-[460px]">
        {next && (
          <div className="absolute inset-x-2 top-2 bottom-0 rounded-2xl border border-line bg-card opacity-60 scale-[0.97]" />
        )}

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onTransitionEnd={finalize}
          style={{ transform, transition: dragging ? "none" : "transform 0.32s ease" }}
          className="absolute inset-0 overflow-y-auto rounded-2xl border border-line bg-card shadow-sm touch-pan-y select-none cursor-grab active:cursor-grabbing"
        >
          {/* swipe intent overlays */}
          <span
            className="pointer-events-none absolute top-4 right-4 z-10 rounded-lg border-2 border-accent px-3 py-1 text-sm font-bold text-accent rotate-12"
            style={{ opacity: dx > 0 ? Math.min(dx / SWIPE_THRESHOLD, 1) : 0 }}
          >
            SAVE
          </span>
          <span
            className="pointer-events-none absolute top-4 left-4 z-10 rounded-lg border-2 border-warn px-3 py-1 text-sm font-bold text-warn -rotate-12"
            style={{ opacity: dx < 0 ? Math.min(-dx / SWIPE_THRESHOLD, 1) : 0 }}
          >
            PASS
          </span>

          {current && <CardFace match={current} profile={profile} expanded={expanded} />}
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Tap the card for details · swipe or use the buttons to decide
      </p>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => commit("left")}
          aria-label="Pass"
          className="h-16 w-16 rounded-full border border-line bg-card text-2xl text-warn active:scale-95 transition shadow-sm"
        >
          ✕
        </button>
        <button
          onClick={() => commit("right")}
          aria-label="Save"
          className="h-16 w-16 rounded-full bg-accent text-2xl text-white active:scale-95 transition shadow-sm"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

// --- saved list (shown after the deck is exhausted) ------------------------

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
        <div className="rounded-xl border border-line bg-card p-5">
          <h2 className="font-semibold text-ink">You passed on all {total}.</h2>
          <p className="mt-2 text-sm text-muted">
            No shame in being picky — but the right-fit schools here will actually recruit you. Give
            it another pass with an open mind.
          </p>
        </div>
        <a href="/discover" className="rounded-xl bg-ink px-5 py-4 text-center font-semibold text-paper">
          Start over
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-accent">Your list ({saved.length})</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Schools you saved.</h1>
        <p className="mt-2 text-[15px] text-muted">
          For verified coaches, reach out with the draft below. We won&apos;t share contacts we
          haven&apos;t confirmed.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {saved.map((match) => (
          <div key={match.program.id} className="rounded-xl border border-line bg-card overflow-hidden">
            <CardFace match={match} profile={profile} expanded={true} />
          </div>
        ))}
      </div>

      <a href="/discover" className="text-center text-sm text-muted underline">
        Swipe through the rest again
      </a>
    </div>
  );
}
