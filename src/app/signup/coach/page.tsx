"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpCoach } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";
import { AuthField, AuthSection, AuthTopBar, authInput } from "@/components/AuthForm";

export default function CoachSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({
    name: "", email: "", password: "",
    school: "", sport: "Men's Basketball", role: "head" as "head" | "assistant",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  function next() {
    setError(null);
    if (!f.name.trim()) return setError("Add your name.");
    if (!/.+@.+\..+/.test(f.email)) return setError("Enter a valid email.");
    if (f.password.length < 6) return setError("Password needs at least 6 characters.");
    setStep(2);
  }

  async function submit() {
    setError(null);
    if (!f.school.trim()) return setError("Add your school.");
    if (!supabaseConfigured) return setError("Auth isn't configured yet (missing Supabase keys).");
    setBusy(true);
    try {
      await signUpCoach({
        name: f.name.trim(), email: f.email.trim(), password: f.password,
        school: f.school.trim(), sport: f.sport, role: f.role,
      });
      setDone(true);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === 3 && done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success text-3xl">✓</span>
        <h1 className="font-head text-3xl font-bold tracking-tight text-fg">You&apos;re in the queue.</h1>
        <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">
          We verify every coach account by hand — it&apos;s how athletes know the contact is real.
          You&apos;ll hear from us within 24 hours.
        </p>
        <button onClick={() => router.push("/coaches")} className="mt-2 w-full rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition">
          Got it
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <AuthTopBar step={step} total={3} onBack={() => (step === 1 ? router.push("/") : setStep(1))} />

      {step === 1 && (
        <AuthSection title="Create your account" sub="Coach access is manually verified before you can browse.">
          <AuthField label="Your name"><input className={authInput} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="First and last" /></AuthField>
          <AuthField label="Email"><input className={authInput} type="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@school.edu" /></AuthField>
          <AuthField label="Password"><input className={authInput} type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" /></AuthField>
        </AuthSection>
      )}

      {step === 2 && (
        <AuthSection title="Your program" sub="This is what we verify against.">
          <AuthField label="School"><input className={authInput} value={f.school} onChange={(e) => set("school", e.target.value)} placeholder="School / college name" /></AuthField>
          <AuthField label="Sport"><input className={authInput} value={f.sport} onChange={(e) => set("sport", e.target.value)} placeholder="e.g. Men's Basketball" /></AuthField>
          <AuthField label="Role">
            <div className="grid grid-cols-2 gap-2">
              {(["head", "assistant"] as const).map((r) => (
                <button key={r} type="button" onClick={() => set("role", r)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium capitalize transition ${f.role === r ? "border-accent bg-accent/10 text-fg" : "border-line bg-surface text-muted"}`}>
                  {r} coach
                </button>
              ))}
            </div>
          </AuthField>
        </AuthSection>
      )}

      {error && <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}

      <div className="mt-auto pt-6">
        {step === 1 ? (
          <button onClick={next} className="w-full rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition">Continue</button>
        ) : (
          <button onClick={submit} disabled={busy} className="w-full rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition disabled:opacity-60">
            {busy ? "Creating your account…" : "Create coach account"}
          </button>
        )}
      </div>
    </div>
  );
}
