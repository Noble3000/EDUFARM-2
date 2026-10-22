"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";

type Me = { id: string; name: string; email: string; role?: string };

type Notice = { kind: "ok" | "err"; text: string } | null;

function errorText(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "down">("loading");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(async (res) => {
        if (res.status === 401) {
          setState("denied");
          return;
        }
        if (!res.ok) {
          setState("down");
          return;
        }
        const data = await res.json();
        if (!data.user) {
          setState("denied");
          return;
        }
        setMe(data.user);
        setState("ready");
      })
      .catch(() => setState("down"));
  }, []);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const target = newEmail.trim().toLowerCase();
    if (!target || !target.includes("@")) {
      setNotice({ kind: "err", text: "Enter a valid email address." });
      return;
    }
    if (target === me?.email.toLowerCase()) {
      setNotice({ kind: "err", text: "That is already your email address." });
      return;
    }
    setBusy(true);
    try {
      const res = await authClient.emailOtp.requestEmailChange({ newEmail: target });
      if (res.error) {
        setNotice({ kind: "err", text: errorText(res.error, "Could not send a code. Try again.") });
        return;
      }
      setStep("code");
      setNotice({
        kind: "ok",
        text: `We sent a 6-digit code to ${target}. Enter it below to confirm the change.`,
      });
    } catch {
      setNotice({ kind: "err", text: "Could not reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function confirmChange(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const target = newEmail.trim().toLowerCase();
    if (!/^\d{6}$/.test(code.trim())) {
      setNotice({ kind: "err", text: "Enter the 6-digit code from the email." });
      return;
    }
    setBusy(true);
    try {
      const res = await authClient.emailOtp.changeEmail({ newEmail: target, otp: code.trim() });
      if (res.error) {
        setNotice({ kind: "err", text: errorText(res.error, "That code did not work. Try again.") });
        return;
      }
      setMe((current) => (current ? { ...current, email: target } : current));
      setStep("idle");
      setNewEmail("");
      setCode("");
      setNotice({ kind: "ok", text: "Email updated. Use the new address the next time you log in." });
    } catch {
      setNotice({ kind: "err", text: "Could not reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-2xl animate-pulse rounded-3xl bg-white p-6">
          <div className="h-14 rounded-2xl bg-appwash" />
          <div className="mt-4 h-32 rounded-2xl bg-appwash" />
          <div className="mt-4 h-40 rounded-2xl bg-appwash" />
        </div>
      </div>
    );
  }

  if (state !== "ready") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_8px_30px_rgba(11,77,46,0.12)]">
          <h1 className="font-display text-2xl font-bold">
            {state === "denied" ? "Please log in" : "Starting up…"}
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            {state === "denied"
              ? "Settings are private to your account."
              : "The database is not reachable yet. Try again in a moment."}
          </p>
          <button
            onClick={() => (state === "denied" ? router.push("/login") : window.location.reload())}
            className="mt-6 h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white"
          >
            {state === "denied" ? "Go to Log in" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl bg-edufarm-900 px-3 py-2 text-white sm:gap-4 sm:px-4">
          <Link href="/dashboard" className="font-display text-lg font-bold">
            EduFarm
          </Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Settings
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl px-3 py-1.5 text-[13px] font-semibold ring-1 ring-white/30 hover:bg-white/10"
            >
              Back
            </Link>
            <button
              onClick={async () => {
                await authClient.signOut();
                router.push("/login");
              }}
              className="rounded-xl px-3 py-1.5 text-[13px] font-semibold ring-1 ring-white/30 hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </header>

        {notice && (
          <p
            role="status"
            className={`mt-4 rounded-2xl px-5 py-3 text-sm font-medium ${
              notice.kind === "ok" ? "bg-success-bg text-success-tx" : "bg-danger-bg text-danger-tx"
            }`}
          >
            {notice.text}
          </p>
        )}

        <section className="mt-4 rounded-2xl border border-line p-5" aria-label="Account">
          <h1 className="font-display text-lg font-semibold">Your account</h1>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-appwash px-4 py-3">
              <dt className="text-ink-600">Name</dt>
              <dd className="font-semibold break-all">{me?.name}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-appwash px-4 py-3">
              <dt className="text-ink-600">Email</dt>
              <dd className="font-semibold break-all">{me?.email}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-appwash px-4 py-3">
              <dt className="text-ink-600">Role</dt>
              <dd className="font-semibold capitalize">{me?.role ?? "student"}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-4 rounded-2xl border border-line p-5" aria-label="Appearance">
          <h2 className="font-display text-lg font-semibold">Appearance</h2>
          <p className="mt-1 text-[13px] text-ink-600">
            Switch between light and dark mode. Your choice is remembered on this device.
          </p>
          <ThemeToggle className="mt-3 h-11 w-full rounded-xl border border-line bg-appwash px-4 text-sm font-semibold hover:border-edufarm-700" />
        </section>

        <section className="mt-4 rounded-2xl border border-line p-5" aria-label="Change email">
          <h2 className="font-display text-lg font-semibold">Change email</h2>
          <p className="mt-1 text-[13px] text-ink-600">
            Enter your new email, then confirm the 6-digit code we send to it. Your password stays the same.
          </p>

          {step === "idle" ? (
            <form onSubmit={requestCode} className="mt-3 space-y-2">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="New email address"
                aria-label="New email address"
                className="h-11 w-full rounded-xl border border-line px-4 text-sm"
              />
              <button
                disabled={busy}
                className="h-11 w-full rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send code"}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmChange} className="mt-3 space-y-2">
              <p className="text-[13px] text-ink-600">
                Code sent to <span className="font-semibold break-all">{newEmail.trim()}</span>.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("idle");
                    setCode("");
                    setNotice(null);
                  }}
                  className="font-semibold text-edufarm-800 underline"
                >
                  Use a different email
                </button>
              </p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                placeholder="6-digit code"
                aria-label="Verification code"
                className="h-11 w-full rounded-xl border border-line px-4 text-center text-base font-semibold tracking-[0.3em]"
              />
              <button
                disabled={busy}
                className="h-11 w-full rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Confirming…" : "Confirm new email"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
