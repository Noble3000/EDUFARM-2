"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Overview = {
  course: { id: string; code: string; title: string; lecturerName?: string | null; unitLoad?: number | null; session?: string | null };
  materials: { id: string; title: string; type: string; status: string; allowDownload: boolean }[];
  announcements: { id: string; body: string; publishedAt: string }[];
  sessions: { id: string; title: string; meetingUrl: string; startsAt: string; hostName?: string | null }[];
  assessments: { id: string; title: string; dueAt?: string | null }[];
  tests?: { id: string; title: string; dueAt?: string | null }[];
};

type RosterRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  matricNo?: string | null;
  department?: string | null;
  level?: string | null;
};

const TABS = ["Materials", "Announcements", "Sessions", "Assessments"] as const;
type Tab = (typeof TABS)[number] | "Students";

export function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>("Materials");
  const [state, setState] = useState<"loading" | "ready" | "down" | "missing">("loading");
  const [staff, setStaff] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterRow[] | null>(null);

  const load = useCallback(() => {
    fetch(`/api/courses/${id}/overview`)
      .then((res) => {
        if (res.status === 404) throw new Error("missing");
        if (!res.ok) throw new Error("down");
        return res.json();
      })
      .then((json: Overview) => {
        setData(json);
        setState("ready");
      })
      .catch((e: Error) => setState(e.message === "missing" ? "missing" : "down"));
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.role === "lecturer" || d?.user?.role === "admin") setStaff(true);
      })
      .catch(() => {});
  }, [id, load]);

  async function postAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: id, body: announce }),
    });
    if (!res.ok) {
      setNotice("Could not publish. Try again.");
      return;
    }
    setAnnounce("");
    setNotice("Published to your students' dashboards.");
    load();
  }

  async function access(materialId: string, as: "view" | "download") {
    const res = await fetch(`/api/materials?id=${materialId}&as=${as}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(json.error ?? "Not available.");
      return;
    }
    window.open(json.url, "_blank", "noopener");
  }

  async function reportMaterial(materialId: string, title: string) {
    const reason = window.prompt(`Report "${title}"? Give a brief reason:`);
    if (!reason?.trim()) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "material", targetId: materialId, reason }),
    });
    setNotice(res.ok ? "Thanks — a moderator will review this material." : "Could not send the report.");
  }

  async function openStudents() {
    setTab("Students");
    if (roster !== null) return;
    const res = await fetch(`/api/courses/${id}/students`);
    if (res.ok) {
      const json = await res.json();
      setRoster(json.students ?? []);
    } else {
      setRoster([]);
    }
  }

  if (state === "loading") return <p className="mt-4 text-sm text-ink-600">Loading course…</p>;
  if (state === "down") return <p className="mt-4 text-sm text-ink-600">Database not reachable yet.</p>;
  if (state === "missing" || !data) return <p className="mt-4 text-sm text-ink-600">Course not found.</p>;

  return (
    <>
      <h1 className="mt-2 font-display text-2xl font-bold">
        {data.course.code} — {data.course.title}
      </h1>
      <p className="mt-1 text-[13px] text-ink-600">
        {[data.course.lecturerName, data.course.unitLoad ? `${data.course.unitLoad} units` : "", data.course.session]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Course sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t ? "bg-edufarm-800 text-white" : "bg-appwash text-ink-600 hover:bg-edufarm-050"
            }`}
          >
            {t}
          </button>
        ))}
        {staff && (
          <button
            role="tab"
            aria-selected={tab === "Students"}
            onClick={openStudents}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === "Students" ? "bg-ink-900 text-white" : "bg-appwash text-ink-600 hover:bg-edufarm-050"
            }`}
          >
            Students
          </button>
        )}
      </div>
      <div className="mt-4 rounded-2xl border border-line p-5">
        {tab === "Materials" &&
          (data.materials.length === 0 ? (
            <Empty text="No published materials yet for this course." />
          ) : (
            <ul className="space-y-2">
              {data.materials.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                  <span className="text-sm font-semibold break-words">{m.title}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    m.status === "published" ? "bg-success-bg text-success-tx" : "bg-warning-bg text-warning-tx"
                  }`}>
                    {m.status === "published" ? "✓ lecturer-confirmed" : m.status}
                  </span>
                  <span className="ml-auto flex gap-2">
                    <button onClick={() => access(m.id, "view")}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-line hover:bg-appwash">
                      View
                    </button>
                    {m.allowDownload && (
                      <button onClick={() => access(m.id, "download")}
                        className="rounded-lg bg-edufarm-800 px-3 py-1.5 text-xs font-bold text-white">
                        Download
                      </button>
                    )}
                    <button onClick={() => reportMaterial(m.id, m.title)}
                      title="Report incorrect or inappropriate content"
                      className="rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-600 ring-1 ring-line hover:bg-danger-bg hover:text-danger-tx">
                      Report
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ))}
              {tab === "Announcements" &&
                (data.announcements.length === 0 && !staff ? (
                  <Empty text="No announcements yet for this course." />
                ) : (
                  <>
                    {staff && (
                      <form onSubmit={postAnnouncement} className="mb-4 flex gap-2">
                        <input value={announce} onChange={(e) => setAnnounce(e.target.value)}
                          required placeholder="Publish an update to your students…"
                          aria-label="Announcement text"
                          className="h-11 flex-1 rounded-xl border border-line px-4 text-sm" />
                        <button className="h-11 rounded-xl bg-ink-900 px-5 text-sm font-bold text-white">
                          Publish
                        </button>
                      </form>
                    )}
                    {notice && <p role="status" className="mb-3 text-sm font-medium text-edufarm-800">{notice}</p>}
                    {data.announcements.length === 0 ? (
                      <Empty text="No announcements yet for this course." />
                    ) : (
                    <ul className="space-y-3">
                      {data.announcements.map((a) => (
                        <li key={a.id} className="rounded-xl bg-appwash p-4 text-sm leading-relaxed">
                          {a.body}
                        </li>
                      ))}
                    </ul>
                    )}
                  </>
                ))}
        {tab === "Sessions" &&
          (data.sessions.length === 0 ? (
            <Empty text="No live sessions scheduled for this course." />
          ) : (
            <ul className="space-y-2">
              {data.sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="tabular text-xs text-ink-600">
                      {new Date(s.startsAt).toLocaleString()}
                      {s.hostName ? ` · Hosted by ${s.hostName}` : ""}
                    </div>
                  </div>
                  <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto rounded-xl bg-edufarm-800 px-4 py-2 text-sm font-semibold text-white">
                    Join
                  </a>
                </li>
              ))}
            </ul>
          ))}
              {tab === "Assessments" &&
                (data.assessments.length === 0 && (data.tests ?? []).length === 0 ? (
                  <Empty text="No assignments or tests yet for this course." />
                ) : (
                  <>
                    <ul className="space-y-2">
                      {data.assessments.map((a) => (
                        <li key={a.id} className="rounded-xl border border-line p-3 text-sm font-semibold">
                          📝 {a.title}
                        </li>
                      ))}
                    </ul>
                    {(data.tests ?? []).length > 0 && (
                      <ul className="mt-2 space-y-2">
                        {data.tests!.map((t) => (
                          <li key={t.id} className="rounded-xl border border-line p-3 text-sm font-semibold">
                            ⏱ {t.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ))}
              {tab === "Students" && staff && (
                roster === null ? (
                  <p className="text-sm text-ink-600">Loading roster…</p>
                ) : roster.length === 0 ? (
                  <Empty text="No students enrolled yet." />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Matric</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3">Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((s) => (
                          <tr key={s.id} className="border-t border-line">
                            <td className="px-4 py-3 font-semibold">{s.name}</td>
                            <td className="px-4 py-3 text-ink-600">{s.matricNo ?? "—"}</td>
                            <td className="px-4 py-3 text-ink-600">{s.department ?? "—"}</td>
                            <td className="px-4 py-3 text-ink-600">{s.level ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
      </div>
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-ink-600">{text}</p>;
}

export function CourseBack() {
  return (
    <Link href="/courses" className="text-sm font-semibold text-edufarm-800">
      ← My Courses
    </Link>
  );
}
