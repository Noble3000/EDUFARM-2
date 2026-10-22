"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Thread = { id: string; courseId: string; question: string; createdAt: string };
type Reply = { id: string; body: string; createdAt: string };
type Feedback = { id: string; courseId: string; body: string; readAt?: string | null; createdAt: string };

export default function DiscussionsPage() {
  const [tab, setTab] = useState<"qa" | "feedback">("qa");
  const [role, setRole] = useState<string>("student");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [courseId, setCourseId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [fbBody, setFbBody] = useState("");
  const [fbCourse, setFbCourse] = useState("");
  const [fbNotice, setFbNotice] = useState<string | null>(null);

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
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.role) setRole(d.user.role);
      })
      .catch(() => {});
    loadFeedback("");
  }, []);

  function loadFeedback(course: string) {
    fetch(`/api/feedback${course ? `?course=${encodeURIComponent(course)}` : ""}`)
      .then((r) => (r.ok ? r.json() : { feedback: [] }))
      .then((d) => setFeedback(d.feedback ?? []))
      .catch(() => {});
  }

  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    setFbNotice(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: fbCourse || undefined, body: fbBody }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFbNotice(json.error ?? "Could not send. Join the course first.");
      return;
    }
    setFbBody("");
    setFbNotice("Sent — only your lecturer sees this, never classmates.");
    loadFeedback("");
  }

  async function markRead(id: string) {
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadFeedback(fbCourse);
  }

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
        <header className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl bg-edufarm-900 px-3 py-2 text-white sm:gap-4 sm:px-4">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Discussion & Feedback
          </span>
        </header>

        <div className="mt-4 flex gap-2" role="tablist" aria-label="Discussion sections">
          {(["qa", "feedback"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === t ? "bg-edufarm-800 text-white" : "bg-appwash text-ink-600 hover:bg-edufarm-050"
              }`}
            >
              {t === "qa" ? "Course Q&A" : "Feedback to lecturers"}
            </button>
          ))}
        </div>

        {tab === "qa" && (
        <>
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        value={drafts[t.id] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                        placeholder="Write a reply…"
                        aria-label="Reply text"
                        className="h-10 min-w-0 flex-1 basis-40 rounded-xl border border-line px-3 text-sm"
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
        </>
        )}

        {tab === "feedback" && (
        <section className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">
            {role === "student" ? "Message your lecturer" : "Student feedback inbox"}
          </h1>
          <p className="mt-1 text-[13px] text-ink-600">
            {role === "student"
              ? "Private feedback for your lecturer — classmates never see it."
              : "Private messages from your students. Reply in class or announcements; messages stay in this inbox."}
          </p>

          {role === "student" && (
            <form onSubmit={sendFeedback} className="mt-3 space-y-3">
              <input
                value={fbCourse}
                onChange={(e) => setFbCourse(e.target.value)}
                placeholder="Course ID"
                aria-label="Course ID"
                className="h-11 w-full rounded-xl border border-line px-4 text-sm"
              />
              <textarea
                value={fbBody}
                onChange={(e) => setFbBody(e.target.value)}
                required
                rows={3}
                maxLength={2000}
                placeholder="What should your lecturer know? (pace, materials, deadlines…)"
                aria-label="Feedback message"
                className="w-full rounded-xl border border-line px-4 py-3 text-sm"
              />
              <button type="submit" className="h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white">
                Send feedback
              </button>
              {fbNotice && <p role="status" className="text-sm font-medium text-edufarm-800">{fbNotice}</p>}
            </form>
          )}

          {(role === "lecturer" || role === "admin") && (
            <div className="mt-3 flex gap-2">
              <input
                value={fbCourse}
                onChange={(e) => {
                  setFbCourse(e.target.value);
                  loadFeedback(e.target.value);
                }}
                placeholder="Filter by course ID (empty = all my courses)"
                aria-label="Filter by course"
                className="h-11 flex-1 rounded-xl border border-line px-4 text-sm"
              />
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-xl border border-line p-3">
                <p className="text-sm leading-relaxed">{f.body}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-600">
                  <span className="tabular">{new Date(f.createdAt).toLocaleString()}</span>
                  {f.readAt ? (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 font-semibold text-success-tx">read</span>
                  ) : (
                    <span className="rounded-full bg-warning-bg px-2 py-0.5 font-semibold text-warning-tx">new</span>
                  )}
                  {(role === "lecturer" || role === "admin") && !f.readAt && (
                    <button onClick={() => markRead(f.id)}
                      className="ml-auto rounded-lg px-2 py-1 font-semibold ring-1 ring-line hover:bg-appwash">
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
            {feedback.length === 0 && (
              <li className="text-sm text-ink-600">
                {role === "student" ? "No feedback sent yet." : "Inbox empty."}
              </li>
            )}
          </ul>
        </section>
        )}
      </div>
    </div>
  );
}
