"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Result = {
  id: string;
  kind?: string;
  score?: number | null;
  maxScore?: number | null;
  feedback?: string | null;
  publishedAt?: string | null;
  assignment: string;
  course: string;
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [testResults, setTestResults] = useState<Result[]>([]);
  const [pending, setPending] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");

  useEffect(() => {
    fetch("/api/results")
      .then((res) => {
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((data) => {
        setResults(data.results ?? []);
        setTestResults(data.testResults ?? []);
        setPending(data.pending ?? 0);
        setState("ready");
      })
      .catch(() => setState("down"));
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl bg-edufarm-900 px-3 py-2 text-white sm:gap-4 sm:px-4">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            My Results
          </span>
        </header>

        <div className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Published results</h1>
          <p className="mt-1 text-[13px] text-ink-600">
            Only you see your marks and feedback — and only after your lecturer
            publishes them.
            {pending > 0 && ` ${pending} submission${pending === 1 ? "" : "s"} still awaiting marking.`}
          </p>
          {state === "loading" && <p className="mt-3 text-sm text-ink-600">Loading…</p>}
          {state === "down" && <p className="mt-3 text-sm text-ink-600">Database not reachable yet.</p>}
          {state === "ready" && results.length === 0 && testResults.length === 0 && (
            <p className="mt-3 text-sm text-ink-600">
              No published results yet. Submitted work shows here once marked
              and published.
            </p>
          )}
          <ul className="mt-3 space-y-3">
            {results.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">📝 {r.assignment}</div>
                    <div className="text-xs text-ink-600">{r.course}</div>
                  </div>
                  <span className="tabular ml-auto rounded-full bg-success-bg px-3 py-1 text-sm font-bold text-success-tx">
                    {r.score ?? "—"}
                  </span>
                </div>
                {r.feedback && (
                  <p className="mt-2 rounded-xl bg-appwash p-3 text-sm leading-relaxed">{r.feedback}</p>
                )}
              </li>
            ))}
            {testResults.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">⏱ {r.assignment}</div>
                    <div className="text-xs text-ink-600">{r.course}</div>
                  </div>
                  <span className="tabular ml-auto rounded-full bg-success-bg px-3 py-1 text-sm font-bold text-success-tx">
                    {r.score ?? "—"}{r.maxScore ? ` / ${r.maxScore}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
