"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../admin-shell";

type U = { id: string; name: string; email: string; role: string; status: string; emailVerified: boolean };

export default function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState("");

  function load(query = "") {
    fetch(`/api/admin/users?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(userId: string, status: string) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    load(q);
  }

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Users</h1>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        className="mt-3 flex gap-2"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…"
          aria-label="Search users" className="h-11 flex-1 rounded-full border border-line px-5 text-sm" />
        <button className="h-11 rounded-full bg-ink-900 px-6 text-sm font-bold text-white">Search</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold">{u.name}</td>
                <td className="px-4 py-3 text-ink-600">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    u.status === "active" ? "bg-success-bg text-success-tx" : "bg-danger-bg text-danger-tx"
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.status === "active" ? (
                    <button onClick={() => setStatus(u.id, "suspended")}
                      className="rounded-lg px-3 py-1.5 text-[13px] font-semibold ring-1 ring-line hover:bg-danger-bg hover:text-danger-tx">
                      Suspend
                    </button>
                  ) : (
                    <button onClick={() => setStatus(u.id, "active")}
                      className="rounded-lg px-3 py-1.5 text-[13px] font-semibold ring-1 ring-line hover:bg-success-bg hover:text-success-tx">
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-ink-600">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
