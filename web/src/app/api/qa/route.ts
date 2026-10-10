import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { qaThreads, enrollments } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Threads across the student's courses (or all for lecturers/admins).
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ threads: [] }, { status: 401 });
    const courseId = new URL(req.url).searchParams.get("course")?.trim() ?? "";

    let ids: string[] | null = null;
    if (user.role === "student") {
      const en = await db
        .select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(eq(enrollments.studentId, user.id));
      ids = en.map((e) => e.courseId);
    }

    const all = await db
      .select()
      .from(qaThreads)
      .orderBy(desc(qaThreads.createdAt));
    const threads = all.filter((t) => {
      if (courseId && t.courseId !== courseId) return false;
      if (ids && !ids.includes(t.courseId)) return false;
      return true;
    });
    return NextResponse.json({ threads });
  } catch {
    return NextResponse.json({ threads: [], error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { courseId, question } = (await req.json()) ?? {};
    if (!courseId || !question?.trim()) {
      return NextResponse.json(
        { error: "Course and question are required." },
        { status: 400 },
      );
    }
    const id = crypto.randomUUID();
    await db.insert(qaThreads).values({ id, courseId, authorId: user.id, question: question.trim() });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  // Report a thread: creates a row in reports (moderation v0).
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { threadId, reason } = (await req.json()) ?? {};
    if (!threadId || !reason?.trim()) {
      return NextResponse.json({ error: "Thread and reason are required." }, { status: 400 });
    }
    const { reports } = await import("@/lib/db/schema");
    await db.insert(reports).values({
      id: crypto.randomUUID(),
      reporterId: user.id,
      targetType: "thread",
      targetId: threadId,
      reason: reason.trim(),
      status: "open",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

