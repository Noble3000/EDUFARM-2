"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  material: { id: string; title: string; type: string; status: string; allowDownload: boolean };
  course: { id: string; code: string; title: string };
};

export default function LibraryPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");

  async function search(query: string) {
    setState("loading");
    try {
      const res = await fetch(`/api/library?q=${encodeURIComponent(query)}`);
      if (!res.ok) return setState("down");
      const data = await res.json();
      setRows(data.materials ?? []);
      setState("ready");
    } catch {
      setState("down");
    }
  }

  useEffect(() => {
    fetch("/api/library?q=")
      .then((res) => {
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((data) => {
        setRows(data.materials ?? []);
        setState("ready");
      })
      .catch(() => setState("down"));
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Library
          </span>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(q);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or course code…"
            aria-label="Search library"
            className="h-11 flex-1 rounded-full border border-line px-5 text-sm"
          />
          <button type="submit" className="h-11 rounded-full bg-edufarm-800 px-6 text-sm font-bold text-white">
            Search
          </button>
        </form>

        <div className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Unified Library</h1>
          <p className="mt-1 text-[13px] text-ink-600">
            Only lecturer-confirmed, published materials carry the confirmed
            badge. Downloads appear only when the lecturer permits them.
          </p>
          {state === "loading" && <p className="mt-3 text-sm text-ink-600">Searching…</p>}
          {state === "down" && (
            <p className="mt-3 text-sm text-ink-600">Database not reachable yet.</p>
          )}
          {state === "ready" && rows.length === 0 && (
            <p className="mt-3 text-sm text-ink-600">
              No materials found. Lecturers publish confirmed materials here.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {rows.map(({ material: m, course: c }) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <div>
                  <div className="text-sm font-semibold">{m.title}</div>
                  <div className="text-xs text-ink-600">
                    {c.code} · {c.title} · {m.type}
                  </div>
                </div>
                <span className="ml-auto rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-tx">
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
