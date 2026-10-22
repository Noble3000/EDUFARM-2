"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../admin-shell";

type Row = {
  app: { id: string; userId: string; department?: string | null; status: string; note?: string | null; createdAt: string };
  applicant: { name: string; email: string };
  evidenceUrls: string[];
};

export default function VerificationQueue() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("pending");

  function load() {
    fetch("/api/admin/verification")
      .then((r) => (r.ok ? r.json() : { queue: [] }))
      .then((d) => setRows(d.queue ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, decision: string) {
    const note = window.prompt(`Note for the applicant (optional, decision: ${decision}):`) ?? "";
    const res = await fetch("/api/admin/verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, note }),
    });
    if (res.ok) load();
  }

  const shown = rows.filter((r) => r.app.status === filter);
  const counts = (s: string) => rows.filter((r) => r.app.status === s).length;

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-bold">Lecturer verification</h1>
      <p className="mt-1 text-sm text-ink-600">
        Approval unlocks lecturer tools. Rejection returns the account to
        student access.
      </p>
      <div className="mt-3 flex gap-2" role="tablist" aria-label="Decision filter">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === s ? "bg-ink-900 text-white" : "bg-appwash text-ink-600"
            }`}>
            {s[0].toUpperCase() + s.slice(1)} ({counts(s)})
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {shown.map(({ app, applicant, evidenceUrls }) => (
          <li key={app.id} className="rounded-2xl border border-line p-4">
            <div className="text-sm font-bold break-words">{applicant.name}</div>
            <div className="text-xs break-all text-ink-600">
              {applicant.email} · {app.department ?? "no department"} ·{" "}
              <span className="tabular">{new Date(app.createdAt).toLocaleString()}</span>
            </div>
            {evidenceUrls.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {evidenceUrls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-edufarm-800 ring-1 ring-line hover:bg-edufarm-050">
                    View evidence {evidenceUrls.length > 1 ? i + 1 : ""}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-ink-600">Evidence links unavailable (storage keys pending).</p>
            )}
            {app.note && <p className="mt-1 text-[13px] text-ink-600">Note: {app.note}</p>}
            {app.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => decide(app.id, "approved")}
                  className="h-10 rounded-xl bg-edufarm-800 px-4 text-sm font-bold text-white">
                  Approve
                </button>
                <button onClick={() => decide(app.id, "rejected")}
                  className="h-10 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-danger-bg hover:text-danger-tx">
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
        {shown.length === 0 && (
          <li className="text-sm text-ink-600">Nothing {filter}.</li>
        )}
      </ul>
    </AdminShell>
  );
}
