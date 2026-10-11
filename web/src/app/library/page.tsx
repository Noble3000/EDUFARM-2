"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  material: { id: string; title: string; type: string; status: string; allowDownload: boolean };
  course: { id: string; code: string; title: string };
};

type CourseOpt = { id: string; code: string; title: string };

export default function LibraryPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");
  const [staff, setStaff] = useState(false);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [mine, setMine] = useState<Row[]>([]);
  const [up, setUp] = useState({ courseId: "", title: "", type: "note", session: "", allowDownload: false, publishNow: true });
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function loadMine() {
    try {
      const res = await fetch("/api/library?mine=1");
      if (!res.ok) return;
      const data = await res.json();
      setMine(data.materials ?? []);
    } catch {
      /* stock list is a convenience — never blocks the page */
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
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.role === "lecturer" || d?.user?.role === "admin") {
          setStaff(true);
          fetch("/api/courses")
            .then((r) => (r.ok ? r.json() : null))
            .then((c) => c?.courses && setCourses(c.courses))
            .catch(() => {});
          loadMine();
        }
      })
      .catch(() => {});
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!file) {
      setNotice("Choose a file first.");
      return;
    }
    if (!up.courseId) {
      setNotice("Pick a course from the list.");
      return;
    }
    if (!file.type) {
      setNotice("This file has no readable type. Re-save it as PDF/DOC/PPT/image and try again.");
      return;
    }
    setBusy(true);
    try {
      // Same-origin upload through the app server (no bucket CORS needed).
      const data = new FormData();
      data.append("file", file);
      data.append("purpose", "material");
      const res = await fetch("/api/uploads/direct", { method: "POST", body: data });
      const uploaded = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(uploaded.error ?? `Upload failed (server said ${res.status}). Try again.`);
        return;
      }
      const rec = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...up, filePath: uploaded.key, publish: up.publishNow }),
      });
      const saved = await rec.json().catch(() => ({}));
      if (!rec.ok) {
        setNotice(saved.error ?? "File reached storage but the record failed. Try again.");
        return;
      }
      setNotice(
        saved.status === "published"
          ? "Published — students can see it now, and it stays in your stock below."
          : "Saved as draft — it stays in your stock below. Confirm & publish when students should see it.",
      );
      setUp({ courseId: "", title: "", type: "note", session: "", allowDownload: false, publishNow: true });
      setFile(null);
      search(q);
      loadMine();
    } catch {
      setNotice("Upload failed. Check the file and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(id: string) {
    await fetch("/api/materials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "confirm-publish" }),
    });
    search(q);
    loadMine();
  }

  async function viewOwn(id: string) {
    const res = await fetch(`/api/materials?id=${id}&as=view`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(json.error ?? "Not available.");
      return;
    }
    window.open(json.url, "_blank", "noopener");
  }

  async function reportMaterial(id: string, title: string) {
    const reason = window.prompt(`Report "${title}"? Give a brief reason (incorrect, outdated, inappropriate…):`);
    if (!reason?.trim()) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "material", targetId: id, reason }),
    });
    setNotice(res.ok ? "Thanks — a moderator will review this material." : "Could not send the report. Try again.");
  }

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

        {staff && (
          <form onSubmit={upload} className="mt-4 space-y-3 rounded-2xl border border-line p-5">
            <h2 className="font-display text-lg font-semibold">Upload material</h2>
            <p className="text-[13px] text-ink-600">
              Saved as draft first. Confirm & publish below — only then does it
              carry the lecturer-confirmed badge.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={up.courseId} onChange={(e) => setUp({ ...up, courseId: e.target.value })}
                required aria-label="Course" className="h-11 rounded-xl border border-line px-4 text-sm">
                <option value="">Pick a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                ))}
              </select>
              <input value={up.title} onChange={(e) => setUp({ ...up, title: e.target.value })}
                required placeholder="Title" aria-label="Title"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
              <select value={up.type} onChange={(e) => setUp({ ...up, type: e.target.value })}
                aria-label="Type" className="h-11 rounded-xl border border-line px-4 text-sm">
                <option value="note">Note</option>
                <option value="past-question">Past question</option>
                <option value="guide">Study guide</option>
                <option value="other">Other</option>
              </select>
              <input value={up.session} onChange={(e) => setUp({ ...up, session: e.target.value })}
                placeholder="Session (e.g. 2025/2026)" aria-label="Session"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
            </div>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-label="File" className="w-full text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={up.allowDownload}
                onChange={(e) => setUp({ ...up, allowDownload: e.target.checked })} />
              Allow students to download (otherwise view-only)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={up.publishNow}
                onChange={(e) => setUp({ ...up, publishNow: e.target.checked })} />
              Publish to students immediately (uncheck to keep as draft)
            </label>
            <button disabled={busy}
              className="h-11 rounded-xl bg-ink-900 px-6 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Uploading…" : "Upload material"}
            </button>
            {notice && <p role="status" className="text-sm font-medium text-edufarm-800">{notice}</p>}
          </form>
        )}

        {staff && (
          <section className="mt-4 rounded-2xl border border-line p-5" aria-label="My uploads">
            <h2 className="font-display text-lg font-semibold">My stock</h2>
            <p className="text-[13px] text-ink-600">
              Everything you uploaded — drafts and published. Nothing leaves
              your reach: drafts stay here until you publish them.
            </p>
            {mine.length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">Nothing uploaded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map(({ material: m, course: c }) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <div>
                      <div className="text-sm font-semibold">{m.title}</div>
                      <div className="text-xs text-ink-600">{c.code} · {c.title} · {m.type}</div>
                    </div>
                    <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
                      m.status === "published" ? "bg-success-bg text-success-tx" : "bg-warning-bg text-warning-tx"
                    }`}>
                      {m.status === "published" ? "✓ live for students" : "draft — only you"}
                    </span>
                    <button onClick={() => viewOwn(m.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-line hover:bg-appwash">
                      View
                    </button>
                    {m.status !== "published" && (
                      <button onClick={() => confirm(m.id)}
                        className="rounded-xl bg-edufarm-800 px-3 py-1.5 text-xs font-bold text-white">
                        Publish
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="mt-4 rounded-2xl border border-line p-5">
          <h1 className="font-display text-xl font-bold">Unified Library</h1>
          <p className="mt-1 text-[13px] text-ink-600">
            Students view published materials here — only lecturers upload.
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
                <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
                  m.status === "published" ? "bg-success-bg text-success-tx" : "bg-warning-bg text-warning-tx"
                }`}>
                  {m.status === "published" ? "✓ lecturer-confirmed" : m.status}
                </span>
                {staff && m.status !== "published" && (
                  <button onClick={() => confirm(m.id)}
                    className="rounded-xl bg-edufarm-800 px-3 py-1.5 text-xs font-bold text-white">
                    Confirm & publish
                  </button>
                )}
                <button onClick={() => reportMaterial(m.id, m.title)}
                  title="Report incorrect or inappropriate content"
                  className="rounded-xl px-2 py-1.5 text-xs font-semibold text-ink-600 ring-1 ring-line hover:bg-danger-bg hover:text-danger-tx">
                  Report
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
