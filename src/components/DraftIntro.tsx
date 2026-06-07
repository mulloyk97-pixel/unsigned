"use client";

import { useState } from "react";
import { AthleteProfile, Program } from "@/lib/types";
import { templateIntro } from "@/lib/draftIntro";

// Coach intro draft generator. Calls /api/draft-intro (Groq when configured,
// deterministic template otherwise) and never leaves the athlete empty-handed.
export default function DraftIntro({
  profile,
  program,
}: {
  profile: AthleteProfile;
  program: Program;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/draft-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, program }),
      });
      const data = await res.json();
      setDraft(data.message ?? templateIntro(profile, program));
    } catch {
      setDraft(templateIntro(profile, program));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* text is still on screen */
    }
  }

  if (!draft) {
    return (
      <button
        onClick={generate}
        disabled={loading}
        className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-bg active:scale-[0.99] transition disabled:opacity-60"
      >
        {loading ? "Writing your intro…" : "Draft an honest intro email"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        readOnly
        value={draft}
        rows={12}
        className="w-full rounded-lg border border-line bg-bg p-3 text-sm text-fg leading-relaxed"
      />
      <div className="flex gap-2">
        <button
          onClick={copy}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg active:scale-[0.99] transition"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-accent"
        >
          Redo
        </button>
      </div>
      <p className="text-xs text-muted">Read it before you send. Make it yours — coaches can tell.</p>
    </div>
  );
}
