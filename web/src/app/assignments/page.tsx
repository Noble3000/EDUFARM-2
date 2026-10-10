"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  assignment: { id: string; title: string; dueAt?: string | null };
  course: { code: string; title: string };
  myStatus?: string;
};

const PILL: Record<string, string> = {
  "not-started": "bg-appwash text-ink-600",
  submitted: "bg-warning-bg text-warning-tx",
  marking: "bg-warning-bg text-warning-tx",
  published: "bg-success-bg text-success-tx",
};

export default function AssignmentsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");

  useEffect(() => {
    fetch("/api/assignments")
      .then((res) => {
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((data) => {
        setItems(data.assignments ?? []);
        setState("ready");
      })
      .catch(() => setState("down"));
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Assignments
          </span>
          <Link href="/results" className="ml-auto text-[13px] font-semibold text-emerald-100/90 hover:text-white">
            My Results →
          </Link>
        </header>

        <div className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Requires action</h1>
          {state === "loading" && <p className="mt-2 text-sm text-ink-600">Loading…</p>}
          {state === "down" && <p className="mt-2 text-sm text-ink-600">Database not reachable yet.</p>}
          {state === "ready" && items.length === 0 && (
            <p className="mt-2 text-sm text-ink-600">
              Nothing assigned. You are caught up — check back after your
              lecturers publish work.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {items.map(({ assignment: a, course: c, myStatus }) => (
              <li key={a.id}>
                <Link
                  href={`/assignments/${a.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line p-4 hover:border-edufarm-700 hover:bg-edufarm-050"
                >
                  <div>
                    <div className="text-sm font-bold">{a.title}</div>
                    <div className="mt-0.5 text-xs text-ink-600">
                      {c.code} · {a.dueAt ? (
                        <>Due <span className="tabular">{new Date(a.dueAt).toLocaleString()}</span></>
                      ) : (
                        "No due date"
                      )}
                    </div>
                  </div>
                  {myStatus && (
                    <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[myStatus] ?? PILL["not-started"]}`}>
                      {myStatus === "not-started" ? "Not started" : myStatus[0].toUpperCase() + myStatus.slice(1)}
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
