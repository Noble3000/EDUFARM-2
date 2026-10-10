"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Step = "account" | "evidence" | "done";

export default function LecturerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [department, setDepartment] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // Auto sign-in gives us a session for the evidence upload that follows.
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) {
        setError(error.message ?? "Could not create your account. Try again.");
        return;
      }
      setStep("evidence");
    } catch {
      setError("Something went wrong. Please try again.");
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
      const keys: string[] = [];
      for (const f of Array.from(files).slice(0, 3)) {
        const ext = f.name.split(".").pop() ?? "bin";
        const sign = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose: "evidence", contentType: f.type || "application/octet-stream", size: f.size, ext }),
        });
        const signed = await sign.json().catch(() => ({}));
        if (!sign.ok) throw new Error(signed.error ?? "Storage not configured yet — ask your administrator.");
        const put = await fetch(signed.url, { method: "PUT", body: f, headers: { "Content-Type": f.type } });
        if (!put.ok) throw new Error("Upload failed — try again.");
        keys.push(signed.key);
      }
      const rec = await fetch("/api/verification/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidencePaths: keys, department }),
      });
      if (!rec.ok) throw new Error("Could not save evidence — try again.");
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
            {department ? ` (${department})` : ""}. Verify your email, then an
            administrator will review before lecturer tools unlock.
          </p>
          <button onClick={() => router.push("/login")}
            className="mt-6 h-11 w-full rounded-xl bg-ink-900 text-sm font-bold text-white">
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
        <h1 className="mt-2 font-display text-2xl font-bold">
          {step === "account" ? "Lecturer registration" : "Upload evidence"}
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          {step === "account"
            ? "Step 1 of 2 — your account. Evidence comes next."
            : "Step 2 of 2 — staff ID, appointment letter, or department approval (PDF/JPG/PNG, max 3 files)."}
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
              <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">{error}</p>
            )}
            <button type="submit" disabled={busy}
              className="h-11 w-full rounded-xl bg-ink-900 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Creating…" : "Continue to evidence →"}
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
