"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Thread = { id: string; courseId: string; question: string; createdAt: string };
type Reply = { id: string; body: string; createdAt: string };

export default function DiscussionsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [courseId, setCourseId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");

  function load() {
    fetch("/api/qa")
      .then((res) => {
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((data) => {
        setThreads(data.threads ?? []);
        setState("ready");
      })
      .catch(() => setState("down"));
  }

  useEffect(() => {
    load();
  }, []);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: courseId || undefined, question }),
    });
    if (!res.ok) {
      setNotice("Could not post. Add a course first, then ask.");
      return;
    }
    setQuestion("");
    load();
  }

  async function toggle(id: string) {
    if (openId === id) return setOpenId(null);
    setOpenId(id);
    if (!replies[id]) {
      const res = await fetch(`/api/qa/${id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies((r) => ({ ...r, [id]: data.replies ?? [] }));
      }
    }
  }

  async function reply(id: string) {
    const body = drafts[id]?.trim();
    if (!body) return;
    const res = await fetch(`/api/qa/${id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      setDrafts((d) => ({ ...d, [id]: "" }));
      const data = await (await fetch(`/api/qa/${id}/replies`)).json();
      setReplies((r) => ({ ...r, [id]: data.replies ?? [] }));
    }
  }

  async function report(id: string) {
    const reason = window.prompt("Why are you reporting this? (brief reason)");
    if (!reason?.trim()) return;
    const res = await fetch("/api/qa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: id, reason }),
    });
    setNotice(res.ok ? "Thanks — we will review this thread." : "Could not send the report. Try again.");
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Discussion & Feedback
          </span>
        </header>

        <section className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Ask a course question</h1>
          <p className="mt-1 text-[13px] text-ink-600">
            Q&amp;A is separate from lecturer announcements. Lecturers and
            students reply in threads.
          </p>
          <form onSubmit={ask} className="mt-3 space-y-3">
            <input
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Course ID (open a course to copy it)"
              aria-label="Course ID"
              className="h-11 w-full rounded-xl border border-line px-4 text-sm"
            />
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              rows={3}
              placeholder="What are you stuck on?"
              aria-label="Your question"
              className="w-full rounded-xl border border-line px-4 py-3 text-sm"
            />
            <button type="submit" className="h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white">
              Post question
            </button>
          </form>
          {notice && <p role="status" className="mt-3 text-sm font-medium text-edufarm-800">{notice}</p>}
        </section>

        <section className="mt-4 rounded-2xl border border-line p-5">
          <h2 className="font-display text-xl font-bold">Threads</h2>
          {state === "loading" && <p className="mt-2 text-sm text-ink-600">Loading…</p>}
          {state === "down" && <p className="mt-2 text-sm text-ink-600">Database not reachable yet.</p>}
          {state === "ready" && threads.length === 0 && (
            <p className="mt-2 text-sm text-ink-600">No questions yet. Ask the first one above.</p>
          )}
          <ul className="mt-3 space-y-3">
            {threads.map((t) => (
              <li key={t.id} className="rounded-2xl border border-line p-4">
                <button onClick={() => toggle(t.id)} className="w-full text-left" aria-expanded={openId === t.id}>
                  <span className="text-sm font-semibold">{t.question}</span>
                  <span className="tabular mt-0.5 block text-xs text-ink-600">
                    {new Date(t.createdAt).toLocaleString()} · {openId === t.id ? "hide replies" : "show replies"}
                  </span>
                </button>
                {openId === t.id && (
                  <div className="mt-3 border-t border-line pt-3">
                    <ul className="space-y-2">
                      {(replies[t.id] ?? []).map((r) => (
                        <li key={r.id} className="rounded-xl bg-appwash p-3 text-sm">{r.body}</li>
                      ))}
                      {(replies[t.id] ?? []).length === 0 && (
                        <li className="text-[13px] text-ink-600">No replies yet.</li>
                      )}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={drafts[t.id] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                        placeholder="Write a reply…"
                        aria-label="Reply text"
                        className="h-10 flex-1 rounded-xl border border-line px-3 text-sm"
                      />
                      <button onClick={() => reply(t.id)}
                        className="h-10 rounded-xl bg-edufarm-800 px-4 text-sm font-semibold text-white">
                        Reply
                      </button>
                      <button onClick={() => report(t.id)}
                        className="h-10 rounded-xl px-3 text-[13px] font-semibold text-ink-600 ring-1 ring-line hover:bg-danger-bg hover:text-danger-tx">
                        Report
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
