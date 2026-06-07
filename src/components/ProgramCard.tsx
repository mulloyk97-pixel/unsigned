"use client";

import { useState } from "react";
import { AthleteProfile, DIVISION_LABEL, ProgramMatch } from "@/lib/types";
import { templateIntro } from "@/lib/draftIntro";

function scoreColor(score: number): string {
  if (score >= 80) return "text-accent";
  if (score >= 60) return "text-ink";
  return "text-muted";
}

export default function ProgramCard({
  match,
  profile,
  rank,
  defaultExpanded = false,
}: {
  match: ProgramMatch;
  profile: AthleteProfile;
  rank: number;
  defaultExpanded?: boolean;
}) {
  const { program, fitScore, why } = match;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [draft, setDraft] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateDraft() {
    setLoadingDraft(true);
    try {
      const res = await fetch("/api/draft-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, program }),
      });
      const data = await res.json();
      setDraft(data.message ?? templateIntro(profile, program));
    } catch {
      setDraft(templateIntro(profile, program)); // never leave them empty
    } finally {
      setLoadingDraft(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be unavailable; the text is still on screen */
    }
  }

  return (
    <div className="rounded-xl border border-line bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <span className="mt-0.5 text-xs font-semibold text-muted w-5 shrink-0">
          {rank}
        </span>
        <span className="flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-semibold text-ink">{program.school}</span>
            <span className={`text-sm font-bold ${scoreColor(fitScore)}`}>
              {fitScore}
              <span className="text-[10px] font-normal text-muted"> /100</span>
            </span>
          </span>
          <span className="block text-xs text-muted mt-0.5">
            {DIVISION_LABEL[program.division]} · {program.conference} ·{" "}
            {program.city}, {program.state}
          </span>
          <span className="block text-sm text-ink mt-2">{why}</span>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-line px-4 py-4 flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">{program.blurb}</p>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Typical net cost</dt>
              <dd className="font-medium text-ink">
                ~${(program.typicalNetCost / 1000).toFixed(0)}k/yr
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Sticker price</dt>
              <dd className="font-medium text-ink">
                ${(program.stickerCost / 1000).toFixed(0)}k/yr
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Avg admit GPA</dt>
              <dd className="font-medium text-ink">{program.avgGpa.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Region</dt>
              <dd className="font-medium text-ink">{program.region}</dd>
            </div>
          </dl>

          <div className="rounded-lg bg-paper border border-line p-3">
            <p className="text-xs text-muted">Coach contact</p>
            <p className="text-sm font-medium text-ink mt-0.5">
              {program.coachName}
            </p>
            <a
              href={`mailto:${program.coachEmail}`}
              className="text-sm text-accent underline break-all"
            >
              {program.coachEmail}
            </a>
          </div>

          {!draft ? (
            <button
              onClick={generateDraft}
              disabled={loadingDraft}
              className="rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-paper active:scale-[0.99] transition disabled:opacity-60"
            >
              {loadingDraft ? "Writing your draft…" : "Draft an honest intro email"}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                readOnly
                value={draft}
                rows={12}
                className="w-full rounded-lg border border-line bg-paper p-3 text-sm text-ink leading-relaxed"
              />
              <div className="flex gap-2">
                <button
                  onClick={copyDraft}
                  className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper active:scale-[0.99] transition"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={generateDraft}
                  disabled={loadingDraft}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink"
                >
                  Redo
                </button>
              </div>
              <p className="text-xs text-muted">
                Read it before you send. Make it yours — coaches can tell.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
