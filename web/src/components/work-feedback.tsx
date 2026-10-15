"use client";

import { useCallback, useEffect, useState } from "react";

type Entry = {
  id: string;
  body: string;
  createdAt: string;
  studentName?: string;
  mine: boolean;
};

// Shared post-work feedback session: students speak after doing the work,
// lecturers read. Used under assignments and online tests.
export function WorkFeedback({
  targetType,
  targetId,
  canPost,
}: {
  targetType: "assignment" | "test";
  targetId: string;
  canPost: boolean;
}) {
  const [rows, setRows] = useState<Entry[]>([]);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/feedback?targetType=${targetType}&targetId=${targetId}`)
      .then((r) => (r.ok ? r.json() : { feedback: [] }))
      .then((d) => setRows(d.feedback ?? []))
      .catch(() => {});
  }, [targetType, targetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, body: body.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(json.error ?? "Could not send. Try again.");
        return;
      }
      setBody("");
      setNotice("Thanks — your lecturer can read this.");
      load();
    } catch {
      setNotice("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-line p-5" aria-label="Feedback session">
      <h2 className="font-display text-lg font-semibold">Feedback session</h2>
      <p className="mt-1 text-[13px] text-ink-600">
        {canPost
          ? "Done with the work? Tell your lecturer how it went — difficulty, clarity, time taken."
          : "What students said after doing this work."}
      </p>
      {canPost && (
        <form onSubmit={send} className="mt-3 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={2000}
            placeholder="e.g. Q3 wording confused me, otherwise fair…"
            aria-label="Your feedback"
            className="h-11 flex-1 rounded-xl border border-line px-4 text-sm"
          />
          <button
            disabled={busy || !body.trim()}
            className="h-11 rounded-xl bg-edufarm-800 px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </form>
      )}
      {notice && (
        <p role="status" className="mt-2 text-sm font-medium text-edufarm-800">
          {notice}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {rows.map((f) => (
          <li key={f.id} className="rounded-xl bg-appwash p-3">
            <p className="text-sm leading-relaxed">{f.body}</p>
            <p className="mt-1 text-xs text-ink-600">
              {f.studentName ? (
                <>
                  <span className="font-bold">{f.studentName}</span> ·{" "}
                </>
              ) : null}
              {f.mine && !f.studentName ? "You · " : null}
              <span className="tabular">{new Date(f.createdAt).toLocaleString()}</span>
            </p>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="mt-2 text-sm text-ink-600">
          {canPost ? "No feedback yet — be the first." : "No feedback yet."}
        </p>
      )}
    </section>
  );
}
