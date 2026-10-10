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
  const [staff, setStaff] = useState(false);
  const [up, setUp] = useState({ courseId: "", title: "", type: "note", session: "", allowDownload: false });
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
        if (d?.user?.role === "lecturer" || d?.user?.role === "admin") setStaff(true);
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
    setBusy(true);
    try {
      // Same-origin upload through the app server (no bucket CORS needed).
      const data = new FormData();
      data.append("file", file);
      data.append("purpose", "material");
      const up = await fetch("/api/uploads/direct", { method: "POST", body: data });
      const uploaded = await up.json().catch(() => ({}));
      if (!up.ok) {
        setNotice(uploaded.error ?? "Upload failed. Check the file and try again.");
        return;
      }
      const rec = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...up, filePath: uploaded.key }),
      });
      if (!rec.ok) throw new Error("record");
      setNotice("Uploaded as draft — confirm & publish below to earn the badge.");
      setUp({ courseId: "", title: "", type: "note", session: "", allowDownload: false });
      setFile(null);
      search(q);
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
              <input value={up.courseId} onChange={(e) => setUp({ ...up, courseId: e.target.value })}
                required placeholder="Course ID" aria-label="Course ID"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
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
            <button disabled={busy}
              className="h-11 rounded-xl bg-ink-900 px-6 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Uploading…" : "Upload as draft"}
            </button>
            {notice && <p role="status" className="text-sm font-medium text-edufarm-800">{notice}</p>}
          </form>
        )}

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
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
