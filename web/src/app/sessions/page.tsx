"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  session: { id: string; title: string; meetingUrl: string; startsAt: string; instructions?: string | null };
  course: { id: string; code: string; title: string };
  state: "live" | "upcoming" | "past";
};

export default function SessionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => {
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((data) => {
        setItems(data.sessions ?? []);
        setState("ready");
      })
      .catch(() => setState("down"));
  }, []);

  const groups: Record<string, Item[]> = { live: [], upcoming: [], past: [] };
  for (const i of items) groups[i.state].push(i);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Live Sessions
          </span>
        </header>

        <div className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Central sessions</h1>
          <p className="mt-1 text-[13px] text-ink-600">
            Same sessions also appear inside each course page. Join opens the
            external call — EduFarm never hosts video.
          </p>
          {state === "loading" && <p className="mt-3 text-sm text-ink-600">Loading…</p>}
          {state === "down" && <p className="mt-3 text-sm text-ink-600">Database not reachable yet.</p>}
          {state === "ready" && items.length === 0 && (
            <p className="mt-3 text-sm text-ink-600">
              No sessions scheduled. Lecturers post links with date, time, and
              joining instructions.
            </p>
          )}
          {(["live", "upcoming", "past"] as const).map(
            (g) =>
              groups[g].length > 0 && (
                <section key={g} className="mt-5" aria-label={g}>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-ink-400">
                    {g === "live" ? "● Live now" : g}
                  </h2>
                  <ul className="mt-2 space-y-2">
                    {groups[g].map(({ session: s, course: c, state: st }) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-3 rounded-xl border border-line p-3"
                        style={st === "past" ? { opacity: 0.6 } : undefined}
                      >
                        <div>
                          <div className="text-sm font-semibold">{s.title}</div>
                          <div className="text-xs text-ink-600">
                            {c.code} · <span className="tabular">{new Date(s.startsAt).toLocaleString()}</span>
                            {s.instructions ? ` · ${s.instructions}` : ""}
                          </div>
                        </div>
                        {st === "past" ? (
                          <span className="ml-auto rounded-full bg-appwash px-2.5 py-1 text-xs font-semibold text-ink-600">
                            Past
                          </span>
                        ) : (
                          <a
                            href={s.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto rounded-xl bg-edufarm-800 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Join
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
