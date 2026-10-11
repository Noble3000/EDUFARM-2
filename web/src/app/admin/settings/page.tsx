"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../admin-shell";

export default function AdminSettings() {
  const [form, setForm] = useState({ siteName: "", supportEmail: "", maintenanceMode: false, defaultSession: "" });
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mail, setMail] = useState<{ gmail: { configured: boolean; ok: boolean; detail: string }; resend: { configured: boolean; ok: boolean; detail: string } } | null>(null);
  const [mailBusy, setMailBusy] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) {
          setForm({
            siteName: d.settings.siteName ?? "",
            supportEmail: d.settings.supportEmail ?? "",
            maintenanceMode: !!d.settings.maintenanceMode,
            defaultSession: d.settings.defaultSession ?? "",
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setNotice(res.ok ? "Settings saved." : "Could not save. Try again.");
  }

  async function checkMail() {
    setMailBusy(true);
    setTestMsg(null);
    try {
      const res = await fetch("/api/admin/email-status");
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMail(data);
      else setTestMsg("Could not check. Try again.");
    } catch {
      setTestMsg("Could not check. Try again.");
    } finally {
      setMailBusy(false);
    }
  }

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setTestMsg(null);
    setMailBusy(true);
    try {
      const res = await fetch("/api/admin/email-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo }),
      });
      const data = await res.json().catch(() => ({}));
      setTestMsg(res.ok ? `Test sent to ${testTo}. Check inbox + spam within a minute.` : (data.error ?? "Could not send. Try again."));
    } catch {
      setTestMsg("Could not send. Try again.");
    } finally {
      setMailBusy(false);
    }
  }

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-ink-600">
        Essential platform information and appearance. Verification,
        moderation, analytics, and devotionals live in their own sections.
      </p>
      {!loaded ? (
        <p className="mt-4 text-sm text-ink-600">Loading…</p>
      ) : (
        <form onSubmit={save} className="mt-4 max-w-lg space-y-4">
          <div>
            <label htmlFor="site" className="text-sm font-semibold">Site name</label>
            <input id="site" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
          </div>
          <div>
            <label htmlFor="support" className="text-sm font-semibold">Support email</label>
            <input id="support" type="email" value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              placeholder="support@university.edu"
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
          </div>
          <div>
            <label htmlFor="session" className="text-sm font-semibold">Default academic session</label>
            <input id="session" value={form.defaultSession}
              onChange={(e) => setForm({ ...form, defaultSession: e.target.value })}
              placeholder="2025/2026"
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.maintenanceMode}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })} />
            Maintenance mode
          </label>
          <button className="h-11 rounded-xl bg-ink-900 px-6 text-sm font-bold text-white">
            Save settings
          </button>
          {notice && <p role="status" className="text-sm font-medium text-edufarm-800">{notice}</p>}
        </form>
      )}

      <section className="mt-6 max-w-lg rounded-2xl border border-line p-5" aria-label="Email delivery">
        <h2 className="font-display text-lg font-semibold">Email delivery</h2>
        <p className="mt-1 text-[13px] text-ink-600">
          Live check of THIS server&apos;s providers — Gmail SMTP first (any inbox),
          Resend second. Green means verification codes will reach users.
        </p>
        <button onClick={checkMail} disabled={mailBusy}
          className="mt-3 h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white disabled:opacity-50">
          {mailBusy ? "Checking…" : "Check providers now"}
        </button>
        {mail && (
          <ul className="mt-3 space-y-2">
            {([["Gmail (any inbox)", mail.gmail], ["Resend", mail.resend]] as const).map(([label, s]) => (
              <li key={label} className="rounded-xl bg-appwash p-3 text-sm">
                <span className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${s.ok ? "bg-success-bg text-success-tx" : "bg-danger-bg text-danger-tx"}`}>
                  {s.ok ? "✓ working" : s.configured ? "✗ broken" : "○ not set"}
                </span>
                <strong>{label}:</strong> {s.detail}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={sendTest} className="mt-4 flex gap-2">
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} required type="email"
            placeholder="Send test to… (any address)" aria-label="Test email address"
            className="h-11 flex-1 rounded-xl border border-line px-4 text-sm" />
          <button disabled={mailBusy}
            className="h-11 rounded-xl bg-ink-900 px-5 text-sm font-bold text-white disabled:opacity-50">
            Send test
          </button>
        </form>
        {testMsg && <p role="status" className="mt-2 text-sm font-medium text-edufarm-800">{testMsg}</p>}
      </section>
    </AdminShell>
  );
}
