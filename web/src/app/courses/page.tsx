"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Course = {
  id: string;
  code: string;
  title: string;
  lecturerName?: string | null;
  unitLoad?: number | null;
  session?: string | null;
};

type Candidate = {
  code: string;
  title: string;
  lecturerName: string;
  unitLoad: number | null;
  session: string;
  selected: boolean;
};

export default function CoursesPage() {
  const [list, setList] = useState<Course[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");
  const [form, setForm] = useState({ code: "", title: "", lecturerName: "", unitLoad: "", session: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [extracting, setExtracting] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/courses");
      if (!res.ok) return setState("down");
      const data = await res.json();
      setList(data.courses ?? []);
      setState("ready");
    } catch {
      setState("down");
    }
  }

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((data) => {
        setList(data.courses ?? []);
        setState("ready");
      })
      .catch(() => setState("down"));
  }, []);

  async function removeCourse(id: string, label: string) {
    if (!window.confirm(`Remove ${label} from your courses? You can add it back manually any time.`)) return;
    setNotice(null);
    setRemoving(id);
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(data.error ?? "Could not remove the course. Try again.");
        return;
      }
      setNotice(`Removed ${label}.`);
      await load();
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setRemoving(null);
    }
  }

  async function extract(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!doc) {
      setError("Choose your registration document first (PDF, Word, or TXT).");
      return;
    }
    setExtracting(true);
    try {
      const data = new FormData();
      data.append("file", doc);
      const res = await fetch("/api/courses/extract", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not read that document.");
        return;
      }
      if (!json.candidates || json.candidates.length === 0) {
        setError("No course codes found — add courses manually below.");
        setCandidates(null);
        return;
      }
      setCandidates(json.candidates.map((c: Candidate) => ({ ...c, selected: true })));
      setNotice(`Found ${json.candidates.length} course${json.candidates.length === 1 ? "" : "s"} — review, correct, then add.`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setExtracting(false);
    }
  }

  function patchCandidate(i: number, patch: Partial<Candidate>) {
    setCandidates((prev) => (prev ?? []).map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  async function addSelected() {
    const chosen = (candidates ?? []).filter((c) => c.selected && c.code.trim() && c.title.trim());
    if (chosen.length === 0) {
      setError("Tick at least one course with a code and title.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const c of chosen) {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: c.code,
            title: c.title,
            lecturerName: c.lecturerName,
            unitLoad: c.unitLoad,
            session: c.session,
          }),
        });
        if (!res.ok) throw new Error("add");
      }
      setCandidates(null);
      setDoc(null);
      setNotice(`Added ${chosen.length} course${chosen.length === 1 ? "" : "s"}.`);
      await load();
    } catch {
      setError("Some courses could not be added (duplicates are skipped silently).");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not add the course. Try again.");
        return;
      }
      setForm({ code: "", title: "", lecturerName: "", unitLoad: "", session: "" });
      await load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <Link href="/dashboard" className="font-display text-lg font-bold">EduFarm</Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            My Courses
          </span>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-line p-5">
            <h1 className="font-display text-xl font-bold">Add a course</h1>
            <p className="mt-1 text-[13px] text-ink-600">
              Two ways: upload your registration document and review what we
              find — or enter manually. Nothing is official until confirmed.
            </p>
            <form onSubmit={extract} className="mt-4 rounded-2xl bg-appwash p-4">
              <label htmlFor="doc" className="text-sm font-semibold">
                Registration document (PDF, Word, TXT)
              </label>
              <div className="mt-2 flex gap-2">
                <input id="doc" type="file" accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setDoc(e.target.files?.[0] ?? null)}
                  className="min-w-0 flex-1 text-sm" />
                <button disabled={extracting}
                  className="h-11 shrink-0 rounded-xl bg-ink-900 px-4 text-sm font-bold text-white disabled:opacity-50">
                  {extracting ? "Reading…" : "Extract"}
                </button>
              </div>
            </form>
            <form onSubmit={add} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="code" className="text-sm font-semibold">Course code</label>
                  <input id="code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="ANA 102" className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
                </div>
                <div>
                  <label htmlFor="units" className="text-sm font-semibold">Units</label>
                  <input id="units" inputMode="numeric" value={form.unitLoad}
                    onChange={(e) => setForm({ ...form, unitLoad: e.target.value })}
                    placeholder="3" className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="title" className="text-sm font-semibold">Title</label>
                <input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Human Anatomy II" className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lecturer" className="text-sm font-semibold">Lecturer</label>
                  <input id="lecturer" value={form.lecturerName}
                    onChange={(e) => setForm({ ...form, lecturerName: e.target.value })}
                    placeholder="Dr. Smith" className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
                </div>
                <div>
                  <label htmlFor="session" className="text-sm font-semibold">Session</label>
                  <input id="session" value={form.session}
                    onChange={(e) => setForm({ ...form, session: e.target.value })}
                    placeholder="2025/2026" className="mt-1 h-11 w-full rounded-xl border border-line px-4 text-sm" />
                </div>
              </div>
              {error && (
                <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-tx">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy}
                className="h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Adding…" : "Add course"}
              </button>
            </form>
          </section>

          {candidates !== null && (
            <section aria-label="Review extracted courses" className="mt-4 rounded-2xl border-2 border-dashed border-edufarm-700/40 p-5 lg:col-span-2">
              <h2 className="font-display text-lg font-semibold">
                Review extracted courses ({candidates.filter((c) => c.selected).length} selected)
              </h2>
              <p className="mt-0.5 text-[13px] text-ink-600">
                Correct anything wrong — nothing is added until you confirm.
              </p>
              <ul className="mt-3 space-y-3">
                {candidates.map((c, i) => (
                  <li key={`${c.code}-${i}`} className="rounded-2xl bg-appwash p-4">
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <input type="checkbox" checked={c.selected}
                        onChange={(e) => patchCandidate(i, { selected: e.target.checked })} />
                      Add this course
                    </label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input value={c.code} onChange={(e) => patchCandidate(i, { code: e.target.value })}
                        placeholder="Code" aria-label="Code"
                        className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                      <input value={c.title} onChange={(e) => patchCandidate(i, { title: e.target.value })}
                        placeholder="Title" aria-label="Title"
                        className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                      <input value={c.lecturerName} onChange={(e) => patchCandidate(i, { lecturerName: e.target.value })}
                        placeholder="Lecturer" aria-label="Lecturer"
                        className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={c.unitLoad ?? ""} onChange={(e) => patchCandidate(i, { unitLoad: Number(e.target.value) || null })}
                          inputMode="numeric" placeholder="Units" aria-label="Units"
                          className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                        <input value={c.session} onChange={(e) => patchCandidate(i, { session: e.target.value })}
                          placeholder="Session" aria-label="Session"
                          className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <button onClick={addSelected} disabled={busy}
                  className="h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white disabled:opacity-50">
                  {busy ? "Adding…" : "Add selected"}
                </button>
                <button onClick={() => setCandidates(null)}
                  className="h-11 rounded-xl px-4 text-sm font-semibold ring-1 ring-line hover:bg-appwash">
                  Discard
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-line p-5">
            <h2 className="font-display text-xl font-bold">Your courses</h2>
            {notice && (
              <p role="status" className="mt-2 rounded-xl bg-info-bg px-4 py-3 text-sm font-medium text-info-tx">
                {notice}
              </p>
            )}
            {state === "loading" && <p className="mt-2 text-sm text-ink-600">Loading…</p>}
            {state === "down" && (
              <p className="mt-2 text-sm text-ink-600">
                Database not reachable yet — finish migration, then retry.
              </p>
            )}
            {state === "ready" && list.length === 0 && (
              <p className="mt-2 text-sm text-ink-600">
                No courses yet. Add your first course on the left.
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {list.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-2xl border border-line p-2 hover:border-edufarm-700 hover:bg-edufarm-050">
                  <Link href={`/courses/${c.id}`} className="flex-1 rounded-xl p-2">
                    <div className="text-sm font-bold">
                      {c.code} — {c.title}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-600">
                      {[c.lecturerName, c.unitLoad ? `${c.unitLoad} units` : "", c.session]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </Link>
                  <button type="button" onClick={() => removeCourse(c.id, `${c.code} — ${c.title}`)}
                    disabled={removing === c.id} aria-label={`Remove ${c.code} — ${c.title}`}
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-danger-tx hover:bg-danger-bg disabled:opacity-50">
                    {removing === c.id ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
