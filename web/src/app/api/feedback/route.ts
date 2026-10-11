import { NextResponse } from "next/server";
import { eq, and, desc, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedbackMessages, enrollments, courses } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// GET: students see their own sent feedback; lecturers see feedback left on
// courses they own or created (admins see all). Never peer-visible.
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ feedback: [] }, { status: 401 });
    const courseId = new URL(req.url).searchParams.get("course")?.trim() ?? "";

    if (user.role === "student") {
      const rows = await db
        .select()
        .from(feedbackMessages)
        .where(eq(feedbackMessages.authorId, user.id))
        .orderBy(desc(feedbackMessages.createdAt));
      return NextResponse.json({
        feedback: rows.filter((r) => !courseId || r.courseId === courseId),
      });
    }

    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json({ feedback: [] }, { status: 403 });
    }

    let scope: string[] | null = null;
    if (user.role === "lecturer") {
      const owned = await db
        .select({ id: courses.id })
        .from(courses)
        .where(
          or(eq(courses.ownerLecturerId, user.id), eq(courses.createdBy, user.id)),
        );
      scope = owned.map((c) => c.id);
      if (scope.length === 0) return NextResponse.json({ feedback: [] });
    }

    const rows = await db
      .select()
      .from(feedbackMessages)
      .orderBy(desc(feedbackMessages.createdAt));
    return NextResponse.json({
      feedback: rows.filter(
        (r) =>
          (!courseId || r.courseId === courseId) &&
          (!scope || scope.includes(r.courseId)),
      ),
    });
  } catch {
    return NextResponse.json({ feedback: [], error: "unavailable" }, { status: 503 });
  }
}

// POST: students only, and only for courses they joined.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "students only" }, { status: 403 });
    }
    const { courseId, body } = (await req.json()) ?? {};
    if (!courseId || !body?.trim()) {
      return NextResponse.json({ error: "Course and message are required." }, { status: 400 });
    }
    const en = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(eq(enrollments.studentId, user.id), eq(enrollments.courseId, courseId)),
      );
    if (en.length === 0) {
      return NextResponse.json({ error: "Join the course first." }, { status: 403 });
    }
    const id = crypto.randomUUID();
    await db.insert(feedbackMessages).values({
      id,
      courseId,
      authorId: user.id,
      body: body.trim().slice(0, 2000),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

// PATCH: lecturers/admins mark a message read.
export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { id } = (await req.json()) ?? {};
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await db
      .update(feedbackMessages)
      .set({ readAt: new Date() })
      .where(eq(feedbackMessages.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
