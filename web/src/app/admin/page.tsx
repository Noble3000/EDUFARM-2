"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "./admin-shell";

type Stats = {
  totalUsers: number;
  students: number;
  lecturers: number;
  pendingLecturers: number;
  openReports: number;
  pendingVerifications: number;
  materials: number;
  submissions: number;
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  const cards: [string, number | undefined, string][] = [
    ["Total users", stats?.totalUsers, "all accounts"],
    ["Students", stats?.students, "verified learners"],
    ["Lecturers", stats?.lecturers, "approved staff"],
    ["Pending verification", stats?.pendingVerifications, "needs review"],
    ["Open reports", stats?.openReports, "moderation queue"],
    ["Materials", stats?.materials, "library items"],
  ];

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-bold">Overview</h1>
      <p className="mt-1 text-sm text-ink-600">
        Outstanding tasks first: verification and moderation queues, then
        platform activity.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl border border-line p-4">
            <div className="text-xs font-medium text-ink-600">{label}</div>
            <div className="tabular mt-1 font-display text-2xl font-bold">
              {value ?? "—"}
            </div>
            <div className="text-xs text-ink-600">{sub}</div>
          </div>
        ))}
      </div>
      {stats && stats.pendingVerifications + stats.openReports === 0 && (
        <p className="mt-4 rounded-2xl bg-success-bg px-5 py-4 text-sm font-medium text-success-tx">
          All clear — no pending verifications or open reports.
        </p>
      )}
    </AdminShell>
  );
}
