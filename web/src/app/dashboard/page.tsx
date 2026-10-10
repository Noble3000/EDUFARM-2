"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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
          <div className="ml-auto flex items-center gap-3">
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

        {/* Activity first (PRD §5.3) */}
        <section className="banner-a mt-4 rounded-2xl p-6 text-white">
          <h1 className="font-display text-2xl font-bold">
            Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-1 text-[13px] opacity-90">
            Academic activity first: deadlines, assignments needing action,
            announcements, recent course activity.
          </p>
        </section>

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
            <p className="mt-1 text-sm text-ink-600">
              Lecturer announcements from your courses will appear here.
            </p>
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
