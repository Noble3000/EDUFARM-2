"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  test: { id: string; title: string; dueAt?: string | null; durationMin?: number | null };
  course: { code: string; title: string };
  myStatus?: string;
};

type BuilderQ = {
  kind: "mcq" | "short";
  prompt: string;
  options: string[];
  answerIndex: number;
  marks: number;
};

const blankQ = (): BuilderQ => ({ kind: "mcq", prompt: "", options: ["", ""], answerIndex: 0, marks: 1 });

export default function TestsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");
  const [staff, setStaff] = useState(false);
  const [courses, setCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [form, setForm] = useState({ courseId: "", title: "", instructions: "", durationMin: "", dueAt: "" });
  const [qs, setQs] = useState<BuilderQ[]>([blankQ()]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/tests")
      .then((res) => {
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((data) => {
        setItems(data.tests ?? []);
        setState("ready");
      })
      .catch(() => setState("down"));
  }

  useEffect(() => {
    load();
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.role === "lecturer" || d?.user?.role === "admin") {
          setStaff(true);
          fetch("/api/courses")
            .then((r) => (r.ok ? r.json() : null))
            .then((c) => c?.courses && setCourses(c.courses))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  function patchQ(i: number, patch: Partial<BuilderQ>) {
    setQs((prev) => prev.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, questions: qs }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(json.error ?? "Could not create. Try again.");
        return;
      }
      setForm({ courseId: "", title: "", instructions: "", durationMin: "", dueAt: "" });
      setQs([blankQ()]);
      setNotice("Test created — students in the course can take it once.");
      load();
    } catch {
      setNotice("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Online Tests
          </span>
          <Link href="/results" className="ml-auto text-[13px] font-semibold text-emerald-100/90 hover:text-white">
            My Results →
          </Link>
        </header>

        {staff && (
          <form onSubmit={create} className="mt-4 space-y-3 rounded-2xl border border-line p-5">
            <h2 className="font-display text-lg font-semibold">New test</h2>
            <p className="text-[13px] text-ink-600">
              Simple MCQs (auto-marked) and short answers (you review). No
              proctoring in v1. One attempt per student.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                required aria-label="Course" className="h-11 rounded-xl border border-line px-4 text-sm">
                <option value="">Pick a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                ))}
              </select>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                required placeholder="Title" aria-label="Title"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
              <input value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                inputMode="numeric" placeholder="Minutes (optional)" aria-label="Duration"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
              <input type="datetime-local" value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                aria-label="Due date" className="h-11 rounded-xl border border-line px-4 text-sm" />
            </div>
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={2} placeholder="Instructions (optional)" aria-label="Instructions"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm" />

            {qs.map((q, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-appwash p-4">
                <div className="flex items-center gap-2">
                  <strong className="text-sm">Q{i + 1}</strong>
                  <select value={q.kind} onChange={(e) => patchQ(i, { kind: e.target.value as "mcq" | "short" })}
                    aria-label="Question type" className="h-9 rounded-lg border border-line bg-white px-2 text-sm">
                    <option value="mcq">Multiple choice</option>
                    <option value="short">Short answer</option>
                  </select>
                  <input value={q.marks} onChange={(e) => patchQ(i, { marks: Number(e.target.value) || 1 })}
                    inputMode="numeric" aria-label="Marks" title="Marks"
                    className="h-9 w-20 rounded-lg border border-line bg-white px-2 text-sm" />
                  {qs.length > 1 && (
                    <button type="button" onClick={() => setQs((prev) => prev.filter((_, j) => j !== i))}
                      className="ml-auto text-[13px] font-semibold text-danger-tx hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                <input value={q.prompt} onChange={(e) => patchQ(i, { prompt: e.target.value })}
                  required placeholder="Question prompt" aria-label="Prompt"
                  className="h-11 w-full rounded-xl border border-line bg-white px-4 text-sm" />
                {q.kind === "mcq" && (
                  <div className="space-y-2">
                    {q.options.map((o, k) => (
                      <div key={k} className="flex items-center gap-2">
                        <input type="radio" name={`ans-${i}`} checked={q.answerIndex === k}
                          onChange={() => patchQ(i, { answerIndex: k })}
                          aria-label={`Mark option ${k + 1} correct`} />
                        <input value={o} onChange={(e) =>
                          patchQ(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })
                        }
                          placeholder={`Option ${k + 1}`} aria-label={`Option ${k + 1}`}
                          className="h-10 flex-1 rounded-xl border border-line bg-white px-3 text-sm" />
                      </div>
                    ))}
                    <button type="button" onClick={() => patchQ(i, { options: [...q.options, ""] })}
                      className="text-[13px] font-semibold text-edufarm-800 hover:underline">
                      + Add option
                    </button>
                    <p className="text-xs text-ink-600">Tick the correct option.</p>
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => setQs((prev) => [...prev, blankQ()])}
                className="h-11 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-appwash">
                + Add question
              </button>
              <button disabled={busy}
                className="h-11 rounded-xl bg-ink-900 px-6 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Creating…" : "Create test"}
              </button>
            </div>
            {notice && <p role="status" className="text-sm font-medium text-edufarm-800">{notice}</p>}
          </form>
        )}

        <div className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Available tests</h1>
          {state === "loading" && <p className="mt-2 text-sm text-ink-600">Loading…</p>}
          {state === "down" && <p className="mt-2 text-sm text-ink-600">Database not reachable yet.</p>}
          {state === "ready" && items.length === 0 && (
            <p className="mt-2 text-sm text-ink-600">No tests yet.</p>
          )}
          <ul className="mt-3 space-y-2">
            {items.map(({ test: t, course: c, myStatus }) => (
              <li key={t.id}>
                <Link href={`/tests/${t.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line p-4 hover:border-edufarm-700 hover:bg-edufarm-050">
                  <div>
                    <div className="text-sm font-bold">{t.title}</div>
                    <div className="mt-0.5 text-xs text-ink-600">
                      {c.code}
                      {t.durationMin ? ` · ${t.durationMin} min` : ""}
                      {t.dueAt ? <> · Due <span className="tabular">{new Date(t.dueAt).toLocaleString()}</span></> : ""}
                    </div>
                  </div>
                  {myStatus && (
                    <span className="ml-auto rounded-full bg-appwash px-2.5 py-1 text-xs font-semibold text-ink-600">
                      {myStatus === "not-started" ? "Not started" : myStatus}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
