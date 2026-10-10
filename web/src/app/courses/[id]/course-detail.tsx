"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Overview = {
  course: { id: string; code: string; title: string; lecturerName?: string | null; unitLoad?: number | null; session?: string | null };
  materials: { id: string; title: string; type: string; status: string; allowDownload: boolean }[];
  announcements: { id: string; body: string; publishedAt: string }[];
  sessions: { id: string; title: string; meetingUrl: string; startsAt: string }[];
  assessments: { id: string; title: string; dueAt?: string | null }[];
};

const TABS = ["Materials", "Announcements", "Sessions", "Assessments"] as const;

export function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Materials");
  const [state, setState] = useState<"loading" | "ready" | "down" | "missing">("loading");

  useEffect(() => {
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
      </div>
      <div className="mt-4 rounded-2xl border border-line p-5">
        {tab === "Materials" &&
          (data.materials.length === 0 ? (
            <Empty text="No published materials yet for this course." />
          ) : (
            <ul className="space-y-2">
              {data.materials.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span className="text-sm font-semibold">{m.title}</span>
                  <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
                    m.status === "published" ? "bg-success-bg text-success-tx" : "bg-warning-bg text-warning-tx"
                  }`}>
                    {m.status}
                  </span>
                </li>
              ))}
            </ul>
          ))}
        {tab === "Announcements" &&
          (data.announcements.length === 0 ? (
            <Empty text="No announcements yet for this course." />
          ) : (
            <ul className="space-y-3">
              {data.announcements.map((a) => (
                <li key={a.id} className="rounded-xl bg-appwash p-4 text-sm leading-relaxed">
                  {a.body}
                </li>
              ))}
            </ul>
          ))}
        {tab === "Sessions" &&
          (data.sessions.length === 0 ? (
            <Empty text="No live sessions scheduled for this course." />
          ) : (
            <ul className="space-y-2">
              {data.sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="tabular text-xs text-ink-600">
                      {new Date(s.startsAt).toLocaleString()}
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
          (data.assessments.length === 0 ? (
            <Empty text="No assignments or tests yet for this course." />
          ) : (
            <ul className="space-y-2">
              {data.assessments.map((a) => (
                <li key={a.id} className="rounded-xl border border-line p-3 text-sm font-semibold">
                  {a.title}
                </li>
              ))}
            </ul>
          ))}
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
