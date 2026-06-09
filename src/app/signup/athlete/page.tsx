"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpAthlete } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";
import { AuthField, AuthSection, AuthTopBar, authInput } from "@/components/AuthForm";

export default function AthleteSignup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/.+@.+\..+/.test(email)) return setError("Enter a valid email.");
    if (password.length < 6) return setError("Password needs at least 6 characters.");
    if (!supabaseConfigured) return setError("Auth isn't configured yet (missing Supabase keys).");
    setBusy(true);
    try {
      await signUpAthlete(email.trim(), password);
      router.push("/build");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col px-5 py-6">
      <AuthTopBar onBack={() => router.push("/")} />

      <AuthSection title="Create your account" sub="Just an email and password — you'll build your card next.">
        <AuthField label="Email">
          <input className={authInput} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </AuthField>
        <AuthField label="Password">
          <input className={authInput} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </AuthField>
      </AuthSection>

      {error && <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}

      <div className="mt-auto pt-6">
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-accent px-5 py-4 font-semibold text-bg active:scale-[0.99] transition disabled:opacity-60">
          {busy ? "Creating your account…" : "Build my card"}
        </button>
      </div>
    </form>
  );
}
