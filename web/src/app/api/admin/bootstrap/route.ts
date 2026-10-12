import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

// ONE-TIME live admin bootstrap. DELETE THIS FILE immediately after use.
// Usage: set BOOTSTRAP_SECRET in host env, redeploy, then POST:
//   { "email": "you@x.com", "secret": "<BOOTSTRAP_SECRET>" }
// Refuses unless the secret is configured (32+ chars) and matches exactly.
export async function POST(req: Request) {
  try {
    const expected = process.env.BOOTSTRAP_SECRET ?? "";
    if (!expected || expected.length < 32) {
      return NextResponse.json({ error: "bootstrap disabled" }, { status: 403 });
    }
    const { email, secret } = (await req.json()) ?? {};
    if (!secret || secret !== expected) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: "valid email required" }, { status: 400 });
    }
    const found = await db.select({ id: user.id }).from(user).where(eq(user.email, email.trim()));
    if (found.length === 0) {
      return NextResponse.json({ error: "no account with that email — register on the live site first" }, { status: 404 });
    }
    await db.update(user).set({ role: "admin", status: "active" }).where(eq(user.id, found[0].id));
    return NextResponse.json({ ok: true, promoted: email.trim() });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
