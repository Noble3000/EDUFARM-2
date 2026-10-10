"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setError(error.message ?? "Could not sign you in. Check your details and try again.");
        return;
      }
      // PRD acceptance: valid credentials open the dashboard directly.
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
        <Link href="/" className="font-display text-lg font-bold text-edufarm-800">
          ← EduFarm
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold">Log in</h1>
        <p className="mt-1 text-sm text-ink-600">
          Students and lecturers sign in with email and password.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm"
              placeholder="you@university.edu"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-line px-4 pr-16 text-sm"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-bold text-edufarm-800 hover:bg-edufarm-050">
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-ink-600">
          <Link href="/forgot-password" className="font-semibold text-edufarm-800 hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="mt-2 text-sm text-ink-600">
          No account?{" "}
          <Link href="/register" className="font-semibold text-edufarm-800 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
