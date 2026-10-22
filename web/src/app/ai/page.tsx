"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Answer = { answer: string; source: "course-material" | "general"; cites: { id: string; title: string }[] };

const MODES = [
  ["explain", "Explain"],
  ["summarize", "Summarize"],
  ["practice", "Practice Qs"],
  ["exam-prep", "Exam prep"],
] as const;

const DRAFT_KINDS = [
  ["outline", "Lesson outline"],
  ["summarize", "Adapt material"],
  ["assignment", "Assignment brief"],
  ["questions", "Test questions"],
  ["marking", "Marking guide"],
] as const;

export default function AIPage() {
  const [role, setRole] = useState<string>("student");
  const [question, setQuestion] = useState("");
  const [courseId, setCourseId] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number][0]>("explain");
  const [result, setResult] = useState<Answer | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [kind, setKind] = useState<(typeof DRAFT_KINDS)[number][0]>("outline");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user?.role && setRole(d.user.role))
      .catch(() => {});
  }, []);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ai/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, courseId: courseId || undefined, mode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not get an answer. Try again.");
        return;
      }
      setResult(json);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function makeDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDraft(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ai/lecturer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, brief }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not draft. Try again.");
        return;
      }
      setDraft(json.draft);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const isStaff = role === "lecturer" || role === "admin";

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl bg-edufarm-900 px-3 py-2 text-white sm:gap-4 sm:px-4">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            AI Help
          </span>
        </header>

        <section className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Study help</h1>
          <p className="mt-1 text-[13px] text-ink-600">
            Explanations, summaries, practice questions, exam prep. Every answer
            is labelled — course-material or general knowledge. AI can be wrong:
            confirm with your lecturer&apos;s materials.
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Study modes">
            {MODES.map(([key, label]) => (
              <button key={key} role="tab" aria-selected={mode === key} onClick={() => setMode(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mode === key ? "bg-edufarm-800 text-white" : "bg-appwash text-ink-600 hover:bg-edufarm-050"
                }`}>
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={ask} className="mt-3 space-y-3">
            <input value={courseId} onChange={(e) => setCourseId(e.target.value)}
              placeholder="Course ID (optional — scopes answers to that course)"
              aria-label="Course ID" className="h-11 w-full rounded-xl border border-line px-4 text-sm" />
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} required rows={3}
              placeholder="e.g. Explain the cardiac cycle simply" aria-label="Your question"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm" />
            <button type="submit" disabled={busy}
              className="h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Thinking…" : "Ask"}
            </button>
          </form>
          {error && !draft && (
            <p role="alert" className="mt-3 rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">{error}</p>
          )}
          {result && (
            <article className="mt-4 rounded-2xl border border-line p-4">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                result.source === "course-material" ? "bg-success-bg text-success-tx" : "bg-info-bg text-info-tx"
              }`}>
                {result.source === "course-material" ? "Based on course material" : "General knowledge"}
              </span>
              <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap">{result.answer}</p>
              {result.cites.length > 0 && (
                <p className="mt-3 text-xs text-ink-600">
                  Grounded in: {result.cites.map((c) => c.title).join(" · ")}
                </p>
              )}
            </article>
          )}
        </section>

        {isStaff && (
          <section className="mt-4 rounded-2xl border border-line p-5">
            <h2 className="font-display text-xl font-bold">Lecturer draft tool</h2>
            <p className="mt-1 text-[13px] text-ink-600">
              Drafts only — review and approve before sharing anything with
              students. Nothing publishes from here.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DRAFT_KINDS.map(([key, label]) => (
                <button key={key} onClick={() => setKind(key)} aria-pressed={kind === key}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    kind === key ? "bg-ink-900 text-white" : "bg-appwash text-ink-600 hover:bg-edufarm-050"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <form onSubmit={makeDraft} className="mt-3 space-y-3">
              <textarea value={brief} onChange={(e) => setBrief(e.target.value)} required rows={4}
                placeholder="Describe the topic, level, and what you need…"
                aria-label="Draft brief" className="w-full rounded-xl border border-line px-4 py-3 text-sm" />
              <button type="submit" disabled={busy}
                className="h-11 rounded-xl bg-ink-900 px-6 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Drafting…" : "Generate draft"}
              </button>
            </form>
            {draft && (
              <article className="mt-4 rounded-2xl border-2 border-dashed border-warning-tx/40 bg-warning-bg/30 p-4">
                <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-bold text-warning-tx">
                  AI draft — review required
                </span>
                <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap">{draft}</p>
              </article>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
