"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { signupErrorMessage } from "@/lib/auth-errors";

type Step = "account" | "code";

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);
    setInfo(null);
    setBusy(true);
    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (error) {
        const friendly = signupErrorMessage(error);
        setError(friendly.message);
        setEmailTaken(friendly.emailInUse);
        return;
      }
      // A 6-digit code was sent (email provider, or server terminal in dev).
      setStep("code");
      setInfo(`We sent a 6-digit code to ${email}. Enter it below — you will be logged in immediately.`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const otp = code.trim();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });
      if (verifyError) {
        setError(verifyError.message ?? "Invalid or expired code. Check it and try again, or resend.");
        return;
      }
      // Code valid → email verified. Log in immediately with the same password.
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      if (signInError) {
        setError("Verified! Now log in with your email and password.");
        router.push("/login");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (error) {
        setError(error.message ?? "Could not resend the code. Wait a minute and try again.");
        return;
      }
      setInfo(`New code sent to ${email}. It expires in 10 minutes.`);
    } catch {
      setError("Could not resend the code. Try again in a minute.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
          <h1 className="font-display text-2xl font-bold">Enter your code</h1>
          <p className="mt-1 text-sm text-ink-600">
            6-digit code sent to <strong>{email}</strong>. Valid for 10 minutes.
            No email? Check spam, or run a local dev server and read the server
            terminal — the code is logged there until an email provider is set.
          </p>
          <form onSubmit={onVerify} className="mt-6 space-y-4">
            <div>
              <label htmlFor="code" className="text-sm font-semibold">Verification code</label>
              <input id="code" required inputMode="numeric" autoComplete="one-time-code"
                minLength={6} maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="mt-1 h-12 w-full rounded-xl border border-line px-4 text-center text-lg tracking-[0.5em]" />
            </div>
            {info && (
              <p role="status" className="rounded-xl bg-info-bg px-4 py-3 text-sm font-medium text-info-tx">
                {info}
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy}
              className="h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Verifying…" : "Verify & log me in"}
            </button>
            <button type="button" onClick={onResend} disabled={busy}
              className="h-11 w-full rounded-xl border border-line text-sm font-bold text-edufarm-800 disabled:opacity-50">
              Resend code
            </button>
          </form>
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
          Use your university email. You will get a 6-digit code to verify it.
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
            <div className="relative mt-1">
              <input id="password" type={showPw ? "text" : "password"} required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-11 w-full rounded-xl border border-line px-4 pr-16 text-sm" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-bold text-edufarm-800 hover:bg-edufarm-050">
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && (
            <div role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">
              <p>{error}</p>
              {emailTaken && (
                <p className="mt-1">
                  Own this email?{" "}
                  <Link href="/login" className="font-bold underline">
                    Log in instead
                  </Link>
                </p>
              )}
            </div>
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
