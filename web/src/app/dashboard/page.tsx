"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { InstallButton } from "@/components/pwa";

type Me = {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "down">(
    "loading",
  );
  const [profile, setProfile] = useState<{ matricNo?: string | null; department?: string | null; level?: string | null } | null | undefined>(undefined);
  const [pform, setPform] = useState({ matricNo: "", department: "", level: "" });
  const [feed, setFeed] = useState<{ id: string; body: string; publishedAt: string; lecturerName: string; courseCode: string; courseTitle: string; courseId: string }[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.status === 401) {
          setState("denied");
          return;
        }
        if (!res.ok) {
          setState("down");
          return;
        }
        const data = await res.json();
        if (!data.user) {
          setState("denied");
          return;
        }
        setMe(data.user);
        setState("ready");
        fetch("/api/announcements")
          .then((r) => (r.ok ? r.json() : null))
          .then((a) => setFeed(a?.announcements ?? []))
          .catch(() => setFeed([]));
        if (data.user.role === "student") {
          fetch("/api/profile")
            .then((r) => (r.ok ? r.json() : null))
            .then((p) => setProfile(p?.profile ?? null))
            .catch(() => setProfile(null));
        }
      } catch {
        setState("down");
      }
    })();
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-6xl animate-pulse rounded-3xl bg-white p-6">
          <div className="h-14 rounded-2xl bg-appwash" />
          <div className="mt-4 h-36 rounded-2xl bg-appwash" />
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-appwash" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_8px_30px_rgba(11,77,46,0.12)]">
          <h1 className="font-display text-2xl font-bold">Please log in</h1>
          <p className="mt-2 text-sm text-ink-600">
            Your dashboard is private to your account.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white"
          >
            Go to Log in
          </button>
        </div>
      </div>
    );
  }

  if (state === "down") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_8px_30px_rgba(11,77,46,0.12)]">
          <h1 className="font-display text-2xl font-bold">Starting up…</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            The database is not reachable yet (first-time setup). Finish
            migration, then refresh — no data is lost.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-11 w-full rounded-xl bg-edufarm-800 text-sm font-bold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pendingLecturer = me?.role === "lecturer_pending";

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-4 sm:p-6">
        <header className="flex h-14 items-center gap-4 rounded-2xl bg-edufarm-900 px-4 text-white">
          <Link href="/" className="font-display text-lg font-bold">
            EduFarm
          </Link>
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-edufarm-800">
            Dashboard
          </span>
          <div className="ml-auto flex items-center gap-2">
            <InstallButton dark compact />
            <span className="hidden text-[13px] opacity-90 sm:block">
              {me?.name}
            </span>
            <button
              onClick={async () => {
                await authClient.signOut();
                router.push("/login");
              }}
              className="rounded-xl px-3 py-1.5 text-[13px] font-semibold ring-1 ring-white/30 hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </header>

        {pendingLecturer && (
          <p className="mt-4 rounded-2xl bg-warning-bg px-5 py-4 text-sm leading-relaxed text-warning-tx">
            <strong>Lecturer verification pending.</strong> You can browse, but
            lecturer tools unlock after an administrator approves your evidence.
          </p>
        )}

        {me?.role === "student" && profile === null && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pform),
              });
              setProfile({ ...pform });
            }}
            className="mt-4 rounded-2xl border border-line p-5"
          >
            <h2 className="font-display text-base font-semibold">Complete your student profile</h2>
            <p className="mt-0.5 text-[13px] text-ink-600">
              Matric number, department, and level help lecturers recognise you.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input value={pform.matricNo} onChange={(e) => setPform({ ...pform, matricNo: e.target.value })}
                placeholder="Matric no." aria-label="Matric number"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
              <input value={pform.department} onChange={(e) => setPform({ ...pform, department: e.target.value })}
                placeholder="Department" aria-label="Department"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
              <input value={pform.level} onChange={(e) => setPform({ ...pform, level: e.target.value })}
                placeholder="Level" aria-label="Level"
                className="h-11 rounded-xl border border-line px-4 text-sm" />
            </div>
            <button className="mt-3 h-11 rounded-xl bg-edufarm-800 px-6 text-sm font-bold text-white">
              Save profile
            </button>
          </form>
        )}

        {/* Activity first (PRD §5.3) */}
        <section className="banner-a mt-4 rounded-2xl p-6 text-white">
          <h1 className="font-display text-2xl font-bold">
            Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-1 text-[13px] opacity-90">
            {me?.role === "lecturer"
              ? "Your teaching workspace: schedule sessions, publish materials and announcements, set work, mark, and read student feedback."
              : "Academic activity first: deadlines, assignments needing action, announcements, recent course activity."}
          </p>
        </section>

        {(me?.role === "lecturer" || me?.role === "admin") && (
          <section className="mt-4 rounded-2xl border border-line p-5" aria-label="Teaching shortcuts">
            <h2 className="font-display text-lg font-semibold">Teach</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["Schedule session", "/sessions"],
                ["New assignment", "/assignments"],
                ["New test", "/tests"],
                ["Upload material", "/library"],
                ["Announce", "/courses"],
                ["Read feedback", "/discussions"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-xl bg-ink-900 p-3 text-center text-[13px] font-semibold text-white hover:opacity-90"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-4 grid gap-4 md:grid-cols-2" aria-label="Academic activity">
          <article className="rounded-2xl border border-line p-5">
            <h2 className="font-display text-lg font-semibold">
              Needs your action
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              No deadlines yet — add courses to fill this feed.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-block rounded-xl bg-edufarm-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Add courses →
            </Link>
          </article>
          <article className="rounded-2xl border border-line p-5">
            <h2 className="font-display text-lg font-semibold">Announcements</h2>
            {feed === null ? (
              <p className="mt-1 text-sm text-ink-600">Loading…</p>
            ) : feed.length === 0 ? (
              <p className="mt-1 text-sm text-ink-600">
                Nothing yet — lecturer announcements land here with the lecturer&apos;s name attached.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {feed.slice(0, 5).map((a) => (
                  <li key={a.id} className="rounded-xl bg-appwash p-3">
                    <p className="text-sm leading-relaxed">{a.body}</p>
                    <p className="mt-1.5 text-xs text-ink-600">
                      <span className="font-bold">{a.lecturerName}</span>
                      {" · "}{a.courseCode} · {a.courseTitle}
                      {" · "}{new Date(a.publishedAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <nav
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          aria-label="Sections"
        >
          {[
            ["My Courses", "/courses"],
            ["Live Sessions", "/sessions"],
            ["Assignments", "/assignments"],
            ["Online Tests", "/tests"],
            ["Discussion", "/discussions"],
            ["Library", "/library"],
            ["AI Help", "/ai"],
            ["My Results", "/results"],
            ...(me?.role === "admin" ? [["Admin", "/admin"] as [string, string]] : []),
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-line p-4 text-center text-sm font-semibold hover:border-edufarm-700 hover:bg-edufarm-050"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
