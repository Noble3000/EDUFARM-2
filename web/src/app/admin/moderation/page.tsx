"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../admin-shell";

type R = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolutionNote?: string | null;
  createdAt: string;
};

export default function ModerationQueue() {
  const [rows, setRows] = useState<R[]>([]);

  function load() {
    fetch("/api/admin/moderation")
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((d) => setRows(d.reports ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string, outcome: string) {
    const resolutionNote = window.prompt(
      `Resolution note (required, outcome: ${outcome}):`,
    );
    if (!resolutionNote?.trim()) return;
    const res = await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, outcome, resolutionNote }),
    });
    if (res.ok) load();
  }

  const open = rows.filter((r) => r.status === "open");
  const closed = rows.filter((r) => r.status !== "open");

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-bold">Content moderation</h1>
      <p className="mt-1 text-sm text-ink-600">
        Every report needs a recorded outcome. Actioning hides or removes the
        target; dismissing leaves it up.
      </p>
      <h2 className="mt-4 text-xs font-bold tracking-widest uppercase text-ink-400">
        Open ({open.length})
      </h2>
      <ul className="mt-2 space-y-3">
        {open.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line p-4">
            <div className="text-sm break-words">
              <strong>{r.targetType}</strong> · {r.reason}
            </div>
            <div className="tabular mt-0.5 text-xs text-ink-600">
              {new Date(r.createdAt).toLocaleString()}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => resolve(r.id, "actioned")}
                className="h-10 rounded-xl bg-edufarm-800 px-4 text-sm font-bold text-white">
                Take action
              </button>
              <button onClick={() => resolve(r.id, "dismissed")}
                className="h-10 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-appwash">
                Dismiss
              </button>
            </div>
          </li>
        ))}
        {open.length === 0 && <li className="text-sm text-ink-600">Queue empty.</li>}
      </ul>
      <h2 className="mt-6 text-xs font-bold tracking-widest uppercase text-ink-400">
        Resolved ({closed.length})
      </h2>
      <ul className="mt-2 space-y-2">
        {closed.map((r) => (
          <li key={r.id} className="rounded-xl bg-appwash p-3 text-sm">
            <strong>{r.status}</strong> — {r.reason}
            {r.resolutionNote && <span className="text-ink-600"> · {r.resolutionNote}</span>}
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
