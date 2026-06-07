"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AthleteProfile,
  COMPETITION_LEVELS,
  CompetitionLevel,
  Sport,
  SPORTS,
  TestType,
} from "@/lib/types";
import { saveProfile } from "@/lib/profile";
import { saveProfileRemote } from "@/lib/supabase";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const labelCls = "block text-sm font-medium text-ink mb-1.5";
const helpCls = "text-xs text-muted mb-1.5";
const inputCls =
  "w-full rounded-lg border border-line bg-card px-3.5 py-3 text-[15px] text-ink outline-none focus:border-accent";

export default function IntakePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    gradYear: "2026",
    sport: "mens-basketball" as Sport,
    position: "",
    gpa: "",
    testType: "none" as TestType,
    testScore: "",
    level: "" as CompetitionLevel | "",
    filmLink: "",
    state: "",
    budgetPerYear: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const gpa = parseFloat(form.gpa);
    if (!form.name.trim()) return setError("Add your name so coaches know who's reaching out.");
    if (Number.isNaN(gpa) || gpa < 0 || gpa > 4.0) return setError("Enter a GPA on a 0–4.0 scale.");
    if (!form.position.trim()) return setError("Add your position.");
    if (!form.level) return setError("Pick the level you've honestly played at.");
    if (!form.state) return setError("Pick your home state so we can match by location.");

    setSubmitting(true);

    const profile: AthleteProfile = {
      name: form.name.trim(),
      gradYear: parseInt(form.gradYear, 10),
      sport: form.sport,
      position: form.position.trim(),
      gpa,
      testType: form.testType,
      testScore:
        form.testType !== "none" && form.testScore
          ? parseInt(form.testScore, 10)
          : null,
      level: form.level,
      filmLink: form.filmLink.trim(),
      state: form.state,
      budgetPerYear: form.budgetPerYear ? parseInt(form.budgetPerYear, 10) : 0,
      createdAt: new Date().toISOString(),
    };

    saveProfile(profile);
    void saveProfileRemote(profile); // best-effort, non-blocking
    router.push("/assessment");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Tell us the truth, we&apos;ll do the same.
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          The more honest you are here, the more useful your assessment. There
          are no wrong answers — only the ones that lead you to programs that
          will actually recruit you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className={labelCls} htmlFor="name">Your name</label>
          <input
            id="name" className={inputCls} value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jordan Rivera"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="gradYear">Grad year</label>
            <select
              id="gradYear" className={inputCls} value={form.gradYear}
              onChange={(e) => update("gradYear", e.target.value)}
            >
              {["2026", "2027", "2028", "2029"].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="state">Home state</label>
            <select
              id="state" className={inputCls} value={form.state}
              onChange={(e) => update("state", e.target.value)}
            >
              <option value="">Select…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="sport">Sport</label>
          <select
            id="sport" className={inputCls} value={form.sport}
            onChange={(e) => update("sport", e.target.value as Sport)}
          >
            {SPORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="position">Position</label>
          <input
            id="position" className={inputCls} value={form.position}
            onChange={(e) => update("position", e.target.value)}
            placeholder="Center back, outfielder, point guard…"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="gpa">GPA (0–4.0)</label>
          <input
            id="gpa" className={inputCls} value={form.gpa} inputMode="decimal"
            onChange={(e) => update("gpa", e.target.value)}
            placeholder="3.4"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="testType">Test (optional)</label>
            <select
              id="testType" className={inputCls} value={form.testType}
              onChange={(e) => update("testType", e.target.value as TestType)}
            >
              <option value="none">None / not taken</option>
              <option value="SAT">SAT</option>
              <option value="ACT">ACT</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="testScore">Score</label>
            <input
              id="testScore" className={inputCls} value={form.testScore}
              inputMode="numeric" disabled={form.testType === "none"}
              onChange={(e) => update("testScore", e.target.value)}
              placeholder={form.testType === "ACT" ? "24" : "1100"}
            />
          </div>
        </div>

        <fieldset>
          <legend className={labelCls}>Level you&apos;ve honestly played</legend>
          <p className={helpCls}>
            Be real with this one — it&apos;s the single biggest factor in an
            accurate read. Nobody sees it but you.
          </p>
          <div className="flex flex-col gap-2">
            {COMPETITION_LEVELS.map((lvl) => (
              <label
                key={lvl.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                  form.level === lvl.value
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-card"
                }`}
              >
                <input
                  type="radio" name="level" value={lvl.value}
                  checked={form.level === lvl.value}
                  onChange={() => update("level", lvl.value)}
                  className="mt-1 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="block text-[15px] font-medium text-ink">{lvl.label}</span>
                  <span className="block text-xs text-muted">{lvl.help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className={labelCls} htmlFor="filmLink">Film link (optional)</label>
          <p className={helpCls}>Hudl, YouTube, Google Drive — whatever you&apos;ve got.</p>
          <input
            id="filmLink" className={inputCls} value={form.filmLink}
            inputMode="url"
            onChange={(e) => update("filmLink", e.target.value)}
            placeholder="https://hudl.com/…"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="budget">
            Family budget per year (optional)
          </label>
          <p className={helpCls}>
            The honest net cost you can carry after aid. We&apos;ll only show
            programs that can realistically work.
          </p>
          <input
            id="budget" className={inputCls} value={form.budgetPerYear}
            inputMode="numeric"
            onChange={(e) => update("budgetPerYear", e.target.value)}
            placeholder="20000"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-warn-soft px-3.5 py-3 text-sm text-warn">
            {error}
          </p>
        )}

        <button
          type="submit" disabled={submitting}
          className="rounded-xl bg-ink px-5 py-4 font-semibold text-paper active:scale-[0.99] transition disabled:opacity-60"
        >
          {submitting ? "Reading your profile…" : "See my honest assessment"}
        </button>
      </form>
    </div>
  );
}
