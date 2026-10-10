"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../admin-shell";

type D = {
  id: string;
  title: string;
  verseRef?: string | null;
  body: string;
  status: string;
  publishAt?: string | null;
  showOnLanding: boolean;
};

export default function DevotionalsAdmin() {
  const [rows, setRows] = useState<D[]>([]);
  const [title, setTitle] = useState("");
  const [verseRef, setVerseRef] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/devotionals")
      .then((r) => (r.ok ? r.json() : { devotionals: [] }))
      .then((d) => setRows(d.devotionals ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/admin/devotionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, verseRef, body }),
    });
    if (!res.ok) {
      setNotice("Could not save. Try again.");
      return;
    }
    setTitle("");
    setVerseRef("");
    setBody("");
    setNotice("Saved as draft. Publish it to show on the landing page.");
    load();
  }

  async function act(id: string, action: string) {
    await fetch("/api/admin/devotionals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-bold">Devotionals</h1>
      <p className="mt-1 text-sm text-ink-600">
        Written manually — no AI generation. Only published items flagged for
        landing display appear publicly.
      </p>

      <form onSubmit={create} className="mt-4 space-y-3 rounded-2xl border border-line p-5">
        <h2 className="font-display text-lg font-semibold">New devotional</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required
          placeholder="Title" aria-label="Title"
          className="h-11 w-full rounded-xl border border-line px-4 text-sm" />
        <input value={verseRef} onChange={(e) => setVerseRef(e.target.value)}
          placeholder="Verse reference (e.g. John 8:12)" aria-label="Verse reference"
          className="h-11 w-full rounded-xl border border-line px-4 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={5}
          placeholder="Devotional text…" aria-label="Body"
          className="w-full rounded-xl border border-line px-4 py-3 text-sm" />
        <button className="h-11 rounded-xl bg-gold-500 px-6 text-sm font-bold text-white">
          Save draft
        </button>
        {notice && <p role="status" className="text-sm font-medium text-edufarm-800">{notice}</p>}
      </form>

      <h2 className="mt-6 text-xs font-bold tracking-widest uppercase text-ink-400">
        History ({rows.length})
      </h2>
      <ul className="mt-2 space-y-3">
        {rows.map((d) => (
          <li key={d.id} className="rounded-2xl border border-line p-4">
            <div className="flex items-center gap-2">
              <strong className="text-sm">{d.title}</strong>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                d.status === "published" ? "bg-success-bg text-success-tx" : "bg-warning-bg text-warning-tx"
              }`}>
                {d.status}
              </span>
              {d.showOnLanding && (
                <span className="rounded-full bg-gold-bg px-2.5 py-0.5 text-xs font-bold text-gold-tx">
                  landing
                </span>
              )}
            </div>
            {d.verseRef && <div className="text-xs text-ink-600">{d.verseRef}</div>}
            <p className="mt-1 line-clamp-3 text-sm text-ink-600">{d.body}</p>
            <div className="mt-3 flex gap-2">
              {d.status !== "published" ? (
                <button onClick={() => act(d.id, "publish")}
                  className="h-10 rounded-xl bg-edufarm-800 px-4 text-sm font-bold text-white">
                  Publish
                </button>
              ) : (
                <button onClick={() => act(d.id, "unpublish")}
                  className="h-10 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-danger-bg hover:text-danger-tx">
                  Unpublish
                </button>
              )}
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-ink-600">No devotionals yet.</li>}
      </ul>
    </AdminShell>
  );
}
