import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Generic content reports (PRD §5.8 + §5.11): any signed-in user can report
// materials, threads, or replies. Admins triage in /admin/moderation.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { targetType, targetId, reason } = (await req.json()) ?? {};
    if (!["material", "thread", "reply"].includes(targetType) || !targetId || !reason?.trim()) {
      return NextResponse.json(
        { error: "Content, reference, and a reason are required." },
        { status: 400 },
      );
    }
    const id = crypto.randomUUID();
    await db.insert(reports).values({
      id,
      reporterId: user.id,
      targetType,
      targetId,
      reason: reason.trim().slice(0, 500),
      status: "open",
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
