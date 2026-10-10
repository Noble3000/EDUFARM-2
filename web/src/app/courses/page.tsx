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

export default function CoursesPage() {
  const [list, setList] = useState<Course[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "down">("loading");
  const [form, setForm] = useState({ code: "", title: "", lecturerName: "", unitLoad: "", session: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

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
              Manual entry. Registration-document upload lands next — every
              extracted detail stays editable before adding.
            </p>
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
