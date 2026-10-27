"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../admin-shell";
import { DevotionalView, extractPrayer, formatDevotionalDate } from "../../devotional";

type D = {
  id: string;
  title: string;
  verseRef?: string | null;
  body: string;
  prayer?: string | null;
  status: string;
  publishAt?: string | null;
  showOnLanding: boolean;
};

export default function DevotionalsAdmin() {
  const [rows, setRows] = useState<D[]>([]);
  const [title, setTitle] = useState("");
  const [verseRef, setVerseRef] = useState("");
  const [body, setBody] = useState("");
  const [prayer, setPrayer] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function resetForm() {
    setTitle("");
    setVerseRef("");
    setBody("");
    setPrayer("");
    setEditingId(null);
  }

  function startEdit(d: D) {
    // Legacy rows kept the prayer inside the body — move it into its column.
    const split = extractPrayer(d.body, d.prayer);
    setEditingId(d.id);
    setTitle(d.title);
    setVerseRef(d.verseRef ?? "");
    setBody(split.body);
    setPrayer(split.prayer ?? "");
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/admin/devotionals", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingId
          ? { id: editingId, action: "edit", title, verseRef, body, prayer }
          : { title, verseRef, body, prayer },
      ),
    });
    if (!res.ok) {
      setNotice("Could not save. Try again.");
      return;
    }
    if (editingId) {
      setNotice(
        rows.find((r) => r.id === editingId)?.status === "published"
          ? "Saved — the live devotional was updated."
          : "Saved. Publish it to show on the landing page.",
      );
    } else {
      setNotice("Saved as draft. Publish it to show on the landing page.");
    }
    resetForm();
    load();
  }

  async function act(id: string, action: string) {
    setNotice(null);
    const res = await fetch("/api/admin/devotionals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) {
      setNotice("Could not update. Try again.");
    } else if (action === "publish") {
      setNotice("Published — the previous devotional was retired to history.");
    }
    load();
  }

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-bold">Devotionals</h1>
      <p className="mt-1 text-sm text-ink-600">
        Written manually — no AI generation. Each devotional has its own title,
        verse, message and prayer fields. Only one devotional is live at a time:
        publishing a new one automatically retires the previous to history
        below. Nothing is deleted.
      </p>

      <form onSubmit={save} className="mt-4 space-y-4 rounded-2xl border border-line p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">
            {editingId ? "Edit devotional" : "New devotional"}
          </h2>
          <p className="mt-1 text-xs text-ink-600">
            The message reads in this order: title, verse, body, then prayer.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold tracking-widest uppercase text-ink-400">
              Title
            </span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="Message title" aria-label="Title"
              className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-bold tracking-widest uppercase text-ink-400">
            Bible verse
          </span>
          <textarea value={verseRef} onChange={(e) => setVerseRef(e.target.value)} rows={3}
            placeholder="The scripture with its reference — e.g. For we are his workmanship… (Ephesians 2:10)."
            aria-label="Bible verse"
            className="mt-1 w-full rounded-xl border border-line px-4 py-3 text-sm" />
          <span className="mt-1 block text-xs text-ink-600">
            Shown in bold above the message body.
          </span>
        </label>

        {/* Two columns: the message body, and prayer on its own. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col">
            <span className="text-xs font-bold tracking-widest uppercase text-ink-400">
              Message body
            </span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={7}
              placeholder="Devotional message… (leave a blank line between paragraphs)"
              aria-label="Body"
              className="mt-1 w-full flex-1 rounded-xl border border-line px-4 py-3 text-sm" />
          </label>

          <div className="rounded-xl border border-gold-500/50 bg-gold-bg/40 p-4">
            <label className="flex h-full flex-col">
              <span className="text-xs font-bold tracking-widest uppercase text-gold-tx">
                Prayer / confession
              </span>
              <p className="mt-0.5 text-xs text-ink-600">
                Its own column — appears in a separate prayer block under the message.
              </p>
              <textarea value={prayer} onChange={(e) => setPrayer(e.target.value)} rows={7}
                placeholder="Prayer or confession for the reader to say…"
                aria-label="Prayer or confession"
                className="mt-2 w-full flex-1 rounded-xl border border-line px-4 py-3 text-sm" />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="h-11 rounded-xl bg-gold-500 px-6 text-sm font-bold text-white">
            {editingId ? "Save changes" : "Save draft"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              className="h-11 rounded-xl px-5 text-sm font-semibold ring-1 ring-line hover:bg-appwash">
              Cancel
            </button>
          )}
        </div>
        {notice && <p role="status" className="text-sm font-medium text-edufarm-800">{notice}</p>}
      </form>

      {(title.trim() || body.trim()) && (
        <section className="mt-6" aria-label="Preview">
          <h2 className="text-xs font-bold tracking-widest uppercase text-ink-400">
            Preview
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Exactly how it reads on the home page and dashboards.
          </p>
          <DevotionalView
            className="mt-3"
            content={{
              title: title.trim() || "Message title",
              verseRef,
              body,
              prayer,
              date: formatDevotionalDate(new Date()),
            }}
          />
        </section>
      )}

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
            {d.verseRef && (
              <p className="mt-1 line-clamp-2 text-xs font-semibold text-ink-600">{d.verseRef}</p>
            )}
            <p className="mt-1 line-clamp-3 text-sm text-ink-600">{d.body}</p>
            {d.prayer && (
              <p className="mt-1 line-clamp-2 text-xs text-gold-tx">
                <span className="font-bold uppercase tracking-widest">Prayer:</span> {d.prayer}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => startEdit(d)}
                className="h-10 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-appwash">
                Edit
              </button>
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
