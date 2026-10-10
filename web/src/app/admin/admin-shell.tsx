"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  ["Overview", "/admin"],
  ["Users", "/admin/users"],
  ["Verification", "/admin/verification"],
  ["Moderation", "/admin/moderation"],
  ["Devotionals", "/admin/devotionals"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "denied" | "down">("loading");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (!r.ok) throw new Error("denied");
        return r.json();
      })
      .then((d) => {
        if (d.user?.role === "admin") setState("ready");
        else setState("denied");
      })
      .catch(() => setState("down"));
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-6xl animate-pulse rounded-3xl bg-white p-6">
          <div className="h-14 rounded-2xl bg-appwash" />
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_8px_30px_rgba(11,77,46,0.12)]">
          <h1 className="font-display text-2xl font-bold">Restricted area</h1>
          <p className="mt-2 text-sm text-ink-600">
            Admin access is separate and protected — it is never a public
            signup choice.
          </p>
          <button onClick={() => router.push("/login")}
            className="mt-6 h-11 w-full rounded-xl bg-ink-900 text-sm font-bold text-white">
            Go to Log in
          </button>
        </div>
      </div>
    );
  }

  if (state === "down") {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Starting up…</h1>
          <p className="mt-2 text-sm text-ink-600">Database not reachable yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[248px_1fr]">
        <aside className="rounded-2xl border border-line bg-white p-3">
          <Link href="/" className="block px-3 py-2 font-display text-lg font-bold">
            EduFarm <span className="text-sm font-semibold text-ink-600">· Admin</span>
          </Link>
          <nav className="mt-2" aria-label="Admin">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`mt-1 flex h-10 items-center rounded-xl px-3 text-sm font-medium ${
                  pathname === href
                    ? "bg-appwash font-bold text-ink-900"
                    : "text-ink-600 hover:bg-appwash"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="rounded-3xl bg-white p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
