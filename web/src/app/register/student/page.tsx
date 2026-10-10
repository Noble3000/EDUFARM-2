"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function StudentRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (error) {
        setError(error.message ?? "Could not create your account. Try again.");
        return;
      }
      // Email verification required before dashboard (PRD §5.2).
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-xl text-success-tx">
            ✓
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            We sent a verification link to <strong>{email}</strong>. Open it,
            then log in — you will go straight to your dashboard.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white"
          >
            Go to Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
        <Link href="/register" className="text-sm font-semibold text-edufarm-800">
          ← Change role
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Student registration</h1>
        <p className="mt-1 text-sm text-ink-600">
          Use your university email. Verification is required.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-semibold">Full name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              autoComplete="name" placeholder="Jane Doe"
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-semibold">University email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" placeholder="you@university.edu"
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold">Password</label>
            <input id="password" type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
              placeholder="At least 8 characters"
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy}
            className="h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Creating…" : "Create student account"}
          </button>
        </form>
      </div>
    </div>
  );
}
