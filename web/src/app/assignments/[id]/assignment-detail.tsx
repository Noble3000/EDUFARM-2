"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Detail = {
  assignment: { id: string; title: string; instructions: string; dueAt?: string | null; allowFile: boolean; allowText: boolean };
  course: { code: string; title: string };
  submission?: { id: string; status: string; score?: number | null; feedback?: string | null; bodyText?: string | null } | null;
  submissions?: { id: string; studentId: string; studentName: string; studentEmail: string; status: string; score?: number | null; feedbackDraft?: string | null; bodyText?: string | null }[];
};

export function AssignmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Detail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "down" | "missing">("loading");
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/assignments/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("missing");
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((json: Detail) => {
        setData(json);
        setState("ready");
      })
      .catch((e: Error) => setState(e.message === "missing" ? "missing" : "down"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/assignments/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyText: answer }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(json.error ?? "Could not submit. Try again.");
        return;
      }
      setNotice("Received — your submission is saved. You can resubmit before grading.");
      setAnswer("");
      load();
    } catch {
      setNotice("Something went wrong. Your text is still in the box — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function mark(submissionId: string, publish: boolean, score?: string, feedbackDraft?: string) {
    const res = await fetch(`/api/assignments/${id}/mark`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        score: score === "" || score === undefined ? undefined : Number(score),
        feedbackDraft,
        publish,
      }),
    });
    setNotice(res.ok ? (publish ? "Published — the student can now see it." : "Draft saved — still hidden from the student.") : "Could not save. Try again.");
    if (res.ok) load();
  }

  if (state === "loading") return <p className="mt-4 text-sm text-ink-600">Loading assignment…</p>;
  if (state === "down") return <p className="mt-4 text-sm text-ink-600">Database not reachable yet.</p>;
  if (state === "missing" || !data) return <p className="mt-4 text-sm text-ink-600">Assignment not found.</p>;

  const { assignment: a, course: c } = data;

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-bold">{a.title}</h1>
      <p className="mt-1 text-[13px] text-ink-600">
        {c.code} · {a.dueAt ? <>Due <span className="tabular">{new Date(a.dueAt).toLocaleString()}</span></> : "No due date"}
      </p>
      <div className="mt-4 rounded-2xl bg-appwash p-5 text-sm leading-relaxed">{a.instructions}</div>

      {data.submission !== undefined && (
        <section className="mt-4 rounded-2xl border border-line p-5">
          <h2 className="font-display text-lg font-semibold">Your submission</h2>
          {data.submission ? (
            <>
              <p className="mt-1 text-sm">
                Status:{" "}
                <strong>{data.submission.status === "not-started" ? "Not started" : data.submission.status}</strong>
              </p>
              {data.submission.status === "published" ? (
                <div className="mt-3 rounded-xl bg-success-bg p-4 text-sm">
                  <div className="font-bold text-success-tx">Score: {data.submission.score ?? "—"}</div>
                  {data.submission.feedback && <p className="mt-1">{data.submission.feedback}</p>}
                </div>
              ) : (
                <p className="mt-1 text-[13px] text-ink-600">
                  Marks and feedback appear here only after your lecturer publishes them.
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-600">Not started — submit below.</p>
          )}
          {a.allowText && (!data.submission || data.submission.status !== "published") && (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <label htmlFor="answer" className="text-sm font-semibold">Written answer</label>
              <textarea
                id="answer"
                rows={6}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer… (autosave keeps drafts safe — file upload arrives with R2 keys)"
                className="w-full rounded-xl border border-line px-4 py-3 text-sm"
              />
              <button type="submit" disabled={busy || !answer.trim()}
                className="h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Submitting…" : "Submit answer"}
              </button>
            </form>
          )}
          {!a.allowText && (
            <p className="mt-3 text-sm text-ink-600">This assignment accepts file uploads only — enabled once storage keys are set.</p>
          )}
        </section>
      )}

      {data.submissions !== undefined && (
        <section className="mt-4 rounded-2xl border border-line p-5">
          <h2 className="font-display text-lg font-semibold">
            Received ({data.submissions.length}) — grade + publish, students see scores instantly
          </h2>
          <p className="mt-1 text-[13px] text-ink-600">
            Type a score, add feedback, hit <strong>Publish</strong> — the student&apos;s
            submission box and Results update immediately.
          </p>
          {data.submissions.length === 0 && (
            <p className="mt-1 text-sm text-ink-600">No submissions yet.</p>
          )}
          <ul className="mt-3 space-y-3">
            {data.submissions.map((s) => (
              <MarkRow key={s.id} sub={s} onMark={mark} />
            ))}
          </ul>
        </section>
      )}

      {notice && <p role="status" className="mt-4 rounded-xl bg-edufarm-050 px-4 py-3 text-sm font-medium text-edufarm-800">{notice}</p>}
    </>
  );
}

function MarkRow({
  sub,
  onMark,
}: {
  sub: { id: string; studentId: string; studentName: string; studentEmail: string; status: string; score?: number | null; feedbackDraft?: string | null; bodyText?: string | null };
  onMark: (id: string, publish: boolean, score?: string, feedback?: string) => void;
}) {
  const [score, setScore] = useState(sub.score?.toString() ?? "");
  const [fb, setFb] = useState(sub.feedbackDraft ?? "");
  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <strong>{sub.studentName}</strong>
        <span className="text-xs text-ink-600">{sub.studentEmail}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sub.status === "published" ? "bg-success-bg text-success-tx" : "bg-warning-bg text-warning-tx"}`}>{sub.status}</span>
        {sub.status === "published" && sub.score !== null && sub.score !== undefined && (
          <span className="tabular ml-auto text-sm font-bold">{sub.score}</span>
        )}
      </div>
      {sub.bodyText && <p className="mt-2 max-h-32 overflow-auto rounded-lg bg-appwash p-3 text-[13px]">{sub.bodyText}</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr]">
        <input value={score} onChange={(e) => setScore(e.target.value)} inputMode="numeric"
          placeholder="Score" aria-label="Score" className="h-10 rounded-xl border border-line px-3 text-sm" />
        <input value={fb} onChange={(e) => setFb(e.target.value)}
          placeholder="Written feedback…" aria-label="Feedback" className="h-10 rounded-xl border border-line px-3 text-sm" />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => onMark(sub.id, false, score, fb)}
          className="h-10 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-appwash">
          Save draft
        </button>
        <button onClick={() => onMark(sub.id, true, score, fb)}
          className="h-10 rounded-xl bg-edufarm-800 px-4 text-sm font-bold text-white">
          Publish
        </button>
      </div>
    </li>
  );
}

export function AssignmentBack() {
  return (
    <Link href="/assignments" className="text-sm font-semibold text-edufarm-800">
      ← Assignments
    </Link>
  );
}
