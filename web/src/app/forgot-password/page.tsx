"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) {
        setError(error.message ?? "Could not send the link. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
        <Link href="/login" className="text-sm font-semibold text-edufarm-800">
          ← Back to Log in
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Reset password</h1>
        {done ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            If an account uses <strong>{email}</strong>, a reset link is on its
            way. Open it within the hour.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-semibold">Account email</label>
              <input id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                placeholder="you@university.edu"
                className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">{error}</p>
            )}
            <button disabled={busy}
              className="h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
