"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Q = { id: string; kind: string; prompt: string; options: string[]; marks: number };
type Attempt = { id: string; status: string; score?: number | null };
type FullQ = Q & { answerIndex?: number | null; answerText?: string | null };
type AttRow = { id: string; studentId: string; status: string; score?: number | null; answers: Record<string, { selected?: number; text?: string }> };

type Detail = {
  test: { id: string; title: string; instructions?: string | null; durationMin?: number | null; dueAt?: string | null };
  course: { code: string; title: string };
  questions: Q[];
  attempt?: Attempt | null;
  questionsFull?: undefined;
  attempts?: undefined;
};

type StaffDetail = {
  test: Detail["test"];
  course: Detail["course"];
  questions: FullQ[];
  attempts: AttRow[];
};

export function TestRunner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "down" | "missing">("loading");
  const [answers, setAnswers] = useState<Record<string, { selected?: number; text?: string }>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch(`/api/tests/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("missing");
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((json) => {
        if (json.attempts) setStaff(json);
        else {
          setDetail(json);
          if (json.attempt?.status) setAnswers({});
        }
        setState("ready");
      })
      .catch((e: Error) => setState(e.message === "missing" ? "missing" : "down"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Countdown (display only; server accepts late submits — no proctoring in v1).
  useEffect(() => {
    const t = detail ?? staff;
    if (!t?.test.durationMin) return;
    const end = Date.now() + t.test.durationMin * 60 * 1000;
    const iv = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [detail, staff]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/tests/${id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(json.error ?? "Could not submit. Try again.");
        return;
      }
      setNotice(
        json.published
          ? "Received and auto-marked — see your score below and in Results."
          : "Received — short answers go to your lecturer for review before publishing.",
      );
      load();
    } catch {
      setNotice("Something went wrong. Your answers are still here — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return <p className="mt-4 text-sm text-ink-600">Loading test…</p>;
  if (state === "down") return <p className="mt-4 text-sm text-ink-600">Database not reachable yet.</p>;
  if (state === "missing") return <p className="mt-4 text-sm text-ink-600">Test not found.</p>;

  if (staff) return <MarkingView staff={staff} testId={id} onDone={load} />;

  if (!detail) return null;
  const { test: t, course: c } = detail;
  const submitted = !!detail.attempt;

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-bold">{t.title}</h1>
      <p className="mt-1 text-[13px] text-ink-600">
        {c.code}
        {t.durationMin ? <> · <span className="tabular">{t.durationMin} min</span></> : ""}
        {t.dueAt ? <> · Due <span className="tabular">{new Date(t.dueAt).toLocaleString()}</span></> : ""}
        {left !== null && !submitted && (
          <> · <strong className="tabular">⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</strong></>
        )}
      </p>
      {t.instructions && (
        <div className="mt-4 rounded-2xl bg-appwash p-5 text-sm leading-relaxed">{t.instructions}</div>
      )}

      {submitted ? (
        <div className="mt-4 rounded-2xl border border-line p-5">
          <h2 className="font-display text-lg font-semibold">Submitted ✓</h2>
          <p className="mt-1 text-sm text-ink-600">
            Status: <strong>{detail.attempt!.status}</strong>
            {detail.attempt!.status === "published" && detail.attempt!.score !== null && (
              <> · Score: <strong className="tabular">{detail.attempt!.score}</strong> (also in Results)</>
            )}
            {detail.attempt!.status !== "published" && " — awaiting lecturer review."}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          {detail.questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-line p-4">
              <div className="text-sm font-semibold">
                Q{i + 1} <span className="font-normal text-ink-600">({q.marks} mark{q.marks === 1 ? "" : "s"})</span>
              </div>
              <p className="mt-1 text-sm">{q.prompt}</p>
              {q.kind === "mcq" ? (
                <div className="mt-2 space-y-1.5">
                  {q.options.map((o, k) => (
                    <label key={k} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-appwash">
                      <input type="radio" name={q.id} checked={answers[q.id]?.selected === k}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: { selected: k } }))} />
                      {o}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea rows={3} value={answers[q.id]?.text ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text: e.target.value } }))}
                  placeholder="Your answer…" aria-label={`Answer ${i + 1}`}
                  className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm" />
              )}
            </div>
          ))}
          <button disabled={busy}
            className="h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Submitting…" : "Submit test"}
          </button>
        </form>
      )}
      {notice && <p role="status" className="mt-4 rounded-xl bg-edufarm-050 px-4 py-3 text-sm font-medium text-edufarm-800">{notice}</p>}
    </>
  );
}

function MarkingView({ staff, testId, onDone }: { staff: StaffDetail; testId: string; onDone: () => void }) {
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>({});
  const [notice, setNotice] = useState<string | null>(null);

  async function review(attemptId: string, publish: boolean) {
    const res = await fetch(`/api/tests/${testId}/attempts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, shortMarks: marks[attemptId] ?? {}, publish }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? (publish ? `Published — score ${json.score}.` : "Recalculated (still hidden).") : "Could not save.");
    if (res.ok) onDone();
  }

  const shorts = staff.questions.filter((q) => q.kind === "short");

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-bold">{staff.test.title}</h1>
      <p className="mt-1 text-[13px] text-ink-600">
        {staff.course.code} · {staff.attempts.length} attempt{staff.attempts.length === 1 ? "" : "s"} · MCQ auto-marked
      </p>
      {staff.attempts.length === 0 && <p className="mt-4 text-sm text-ink-600">No attempts yet.</p>}
      <ul className="mt-4 space-y-3">
        {staff.attempts.map((a) => (
          <li key={a.id} className="rounded-2xl border border-line p-4">
            <div className="flex items-center gap-2 text-sm">
              <strong className="truncate">{a.studentId.slice(0, 8)}…</strong>
              <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-semibold text-warning-tx">{a.status}</span>
              {a.score !== null && a.score !== undefined && (
                <span className="tabular text-sm font-bold">MCQ: {a.score}</span>
              )}
            </div>
            {shorts.map((q) => (
              <div key={q.id} className="mt-2 rounded-xl bg-appwash p-3">
                <div className="text-[13px] font-semibold">{q.prompt}</div>
                <p className="mt-1 text-[13px]">{a.answers?.[q.id]?.text || <em className="text-ink-600">no answer</em>}</p>
                {q.answerText && <p className="mt-1 text-xs text-ink-600">Guide: {q.answerText}</p>}
                <input value={marks[a.id]?.[q.id] ?? ""}
                  onChange={(e) => setMarks((m) => ({ ...m, [a.id]: { ...(m[a.id] ?? {}), [q.id]: e.target.value } }))}
                  inputMode="numeric" placeholder={`Marks / ${q.marks}`} aria-label={`Marks for ${q.prompt}`}
                  className="mt-2 h-9 w-32 rounded-lg border border-line bg-white px-2 text-sm" />
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <button onClick={() => review(a.id, false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-appwash">
                Recalculate
              </button>
              <button onClick={() => review(a.id, true)}
                className="h-10 rounded-xl bg-edufarm-800 px-4 text-sm font-bold text-white">
                Publish
              </button>
            </div>
          </li>
        ))}
      </ul>
      {notice && <p role="status" className="mt-4 text-sm font-medium text-edufarm-800">{notice}</p>}
    </>
  );
}

export function TestBack() {
  return (
    <Link href="/tests" className="text-sm font-semibold text-edufarm-800">
      ← Online Tests
    </Link>
  );
}
