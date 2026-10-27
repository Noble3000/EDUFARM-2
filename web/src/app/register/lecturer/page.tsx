"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { signupErrorMessage } from "@/lib/auth-errors";

type Step = "account" | "code" | "evidence" | "done";

export default function LecturerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The code is emailed during sign-up itself, so "Resend" is only a fallback.
  const [resendReady, setResendReady] = useState(false);

  useEffect(() => {
    if (step !== "code") return;
    setResendReady(false);
    const timer = window.setTimeout(() => setResendReady(true), 20000);
    return () => window.clearTimeout(timer);
  }, [step]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);
    setInfo(null);
    setBusy(true);
    try {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) {
        const friendly = signupErrorMessage(error);
        setError(friendly.message);
        setEmailTaken(friendly.emailInUse);
        return;
      }
      // The verification code is sent by the server inside this sign-up call.
      setStep("code");
      setInfo(`We sent a 6-digit code to ${email}. It usually arrives within a few seconds — check spam if you don't see it.`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
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
      // Code valid → log in immediately so evidence upload has a session.
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      if (signInError) {
        setError("Verified! Log in, then come back to upload evidence.");
        router.push("/login");
        return;
      }
      setStep("evidence");
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

  async function submitEvidence(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!files || files.length === 0) {
      setError("Upload at least one evidence file (staff ID or appointment letter).");
      return;
    }
    setBusy(true);
    try {
      // Same-origin uploads through the app server (no bucket CORS needed).
      const keys: string[] = [];
      for (const f of Array.from(files).slice(0, 3)) {
        const data = new FormData();
        data.append("file", f);
        data.append("purpose", "evidence");
        const up = await fetch("/api/uploads/direct", { method: "POST", body: data });
        const uploaded = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(uploaded.error ?? "Upload failed — try again.");
        keys.push(uploaded.key);
      }
      const rec = await fetch("/api/verification/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidencePaths: keys, department }),
      });
      if (!rec.ok) {
        const problem = await rec.json().catch(() => ({}));
        if (rec.status === 401) throw new Error("Your session expired — log in again, then retry.");
        if (problem.error === "not eligible") {
          throw new Error("This account already has lecturer or admin access — no evidence needed.");
        }
        throw new Error(problem.error ?? "Could not save evidence — try again.");
      }
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-xl text-warning-tx">
            ◷
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">Under review</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Evidence received for <strong>{email}</strong>
            {department ? ` (${department})` : ""}. Your email is verified, and
            an administrator will review before lecturer tools unlock.
          </p>
          <button onClick={() => router.push("/login")}
            className="mt-6 h-11 w-full rounded-xl bg-ink-900 text-sm font-bold text-white">
            Go to Log in
          </button>
        </div>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(11,77,46,0.12)] sm:p-8">
          <h1 className="font-display text-2xl font-bold">Enter your code</h1>
          <p className="mt-1 text-sm text-ink-600">
            A 6-digit code is on its way to <strong>{email}</strong>. It is
            valid for 10 minutes. You will be logged in immediately, then upload
            evidence (step 3).
          </p>
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <div>
              <label htmlFor="code" className="text-sm font-semibold">Verification code</label>
              <input id="code" required inputMode="numeric" autoComplete="one-time-code"
                minLength={6} maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="mt-1 h-12 w-full rounded-xl border border-line px-4 text-center text-lg tracking-[0.5em]" />
            </div>
            {info && (
              <p role="status" className="rounded-xl bg-info-bg px-4 py-3 text-sm font-medium text-info-tx">{info}</p>
            )}
            {error && (
              <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">{error}</p>
            )}
            <button type="submit" disabled={busy}
              className="h-11 w-full rounded-xl bg-ink-900 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Verifying…" : "Verify & continue →"}
            </button>
            {/* Resend is a fallback only: the code was emailed during sign-up. */}
            {resendReady ? (
              <button type="button" onClick={onResend} disabled={busy}
                className="h-11 w-full rounded-xl border border-line text-sm font-bold text-ink-900 disabled:opacity-50">
                {busy ? "Sending…" : "Still no email? Send a new code"}
              </button>
            ) : (
              <p className="text-center text-xs text-ink-400">
                No email yet? A resend option appears in a few seconds.
              </p>
            )}
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
        <h1 className="mt-2 font-display text-2xl font-bold">
          {step === "account" ? "Lecturer registration" : "Upload evidence"}
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          {step === "account"
            ? "Step 1 of 3 — your account. A 6-digit code comes next, then evidence."
            : "Step 3 of 3 — staff ID, appointment letter, or department approval (PDF/JPG/PNG, max 3 files)."}
        </p>

        {step === "account" ? (
          <form onSubmit={createAccount} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-semibold">Full name</label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)}
                autoComplete="name" placeholder="Dr. Jane Smith"
                className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-semibold">University email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" placeholder="you@university.edu"
                className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
            </div>
            <div>
              <label htmlFor="department" className="text-sm font-semibold">Department</label>
              <input id="department" value={department} onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Anatomy"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-bold text-ink-900 hover:bg-appwash">
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
              className="h-11 w-full rounded-xl bg-ink-900 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Creating…" : "Send me a code →"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitEvidence} className="mt-6 space-y-4">
            <div>
              <label htmlFor="evidence" className="text-sm font-semibold">Evidence files</label>
              <input id="evidence" type="file" multiple accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFiles(e.target.files)}
                className="mt-1 w-full text-sm" />
            </div>
            <p className="rounded-xl bg-warning-bg px-4 py-3 text-[13px] leading-relaxed text-warning-tx">
              Your account stays limited until an admin approves. Rejection
              returns it to student access — nothing is lost.
            </p>
            {error && (
              <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">{error}</p>
            )}
            <button type="submit" disabled={busy}
              className="h-11 w-full rounded-xl bg-ink-900 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Uploading…" : "Submit for review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
