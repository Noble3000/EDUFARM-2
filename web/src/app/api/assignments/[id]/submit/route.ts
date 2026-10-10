import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments, submissions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Student submit: typed answer and/or R2 file key from a presigned upload.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "student" }, { status: 403 });
    }
    const { id } = await params;
    const found = await db.select().from(assignments).where(eq(assignments.id, id));
    const assignment = found[0];
    if (!assignment) return NextResponse.json({ error: "missing" }, { status: 404 });

    const { bodyText, filePath } = (await req.json()) ?? {};
    if (assignment.allowText === false && !filePath) {
      return NextResponse.json({ error: "A file upload is required." }, { status: 400 });
    }
    if (assignment.allowFile === false && !bodyText?.trim()) {
      return NextResponse.json({ error: "A written answer is required." }, { status: 400 });
    }
    if (!bodyText?.trim() && !filePath) {
      return NextResponse.json({ error: "Submit a file, a written answer, or both." }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.assignmentId, id), eq(submissions.studentId, user.id)));

    if (existing[0]?.status === "published") {
      return NextResponse.json({ error: "Already graded and published — contact your lecturer to resubmit." }, { status: 409 });
    }

    if (existing[0]) {
      // Resubmit before grading resets to submitted (idempotent receipt).
      await db
        .update(submissions)
        .set({
          bodyText: bodyText?.trim() || null,
          filePath: filePath || null,
          status: "submitted",
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, existing[0].id));
      return NextResponse.json({ id: existing[0].id, received: true });
    }

    const subId = crypto.randomUUID();
    await db.insert(submissions).values({
      id: subId,
      assignmentId: id,
      studentId: user.id,
      bodyText: bodyText?.trim() || null,
      filePath: filePath || null,
      status: "submitted",
    });
    return NextResponse.json({ id: subId, received: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
