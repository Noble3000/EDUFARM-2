"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../admin-shell";

export default function AdminSettings() {
  const [form, setForm] = useState({ siteName: "", supportEmail: "", maintenanceMode: false, defaultSession: "" });
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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
    </AdminShell>
  );
}
