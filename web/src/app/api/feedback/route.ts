import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { workFeedback, user as usersTable } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

const TARGETS = ["assignment", "test"] as const;

// Post-work feedback: students speak after doing an assignment/test,
// lecturers read. Students see their own entries; staff see everything
// with names attached.
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ feedback: [] }, { status: 401 });
    const url = new URL(req.url);
    const targetType = url.searchParams.get("targetType")?.trim() ?? "";
    const targetId = url.searchParams.get("targetId")?.trim() ?? "";
    if (!TARGETS.includes(targetType as (typeof TARGETS)[number]) || !targetId) {
      return NextResponse.json({ feedback: [] });
    }

    const staff = user.role === "lecturer" || user.role === "admin";
    const rows = await db
      .select({ entry: workFeedback, student: usersTable })
      .from(workFeedback)
      .innerJoin(usersTable, eq(workFeedback.studentId, usersTable.id))
      .where(
        and(eq(workFeedback.targetType, targetType), eq(workFeedback.targetId, targetId)),
      )
      .orderBy(desc(workFeedback.createdAt));

    const shaped = rows.map(({ entry: f, student: s }) => ({
      id: f.id,
      body: f.body,
      createdAt: f.createdAt,
      studentName: staff ? s.name : undefined,
      mine: f.studentId === user.id,
    }));
    // Students see their own entries only.
    return NextResponse.json({ feedback: staff ? shaped : shaped.filter((f) => f.mine) });
  } catch {
    return NextResponse.json({ feedback: [], error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Only students post feedback here." }, { status: 403 });
    }
    const { targetType, targetId, body } = (await req.json()) ?? {};
    if (!TARGETS.includes(targetType) || !targetId || !body?.trim()) {
      return NextResponse.json({ error: "Feedback text is required." }, { status: 400 });
    }
    if (body.trim().length > 2000) {
      return NextResponse.json({ error: "Keep it under 2000 characters." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await db.insert(workFeedback).values({
      id,
      targetType,
      targetId,
      studentId: user.id,
      body: body.trim(),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
