import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Lecturer marking: save draft (score + feedback hidden) or publish.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { id } = await params;
    const { submissionId, score, feedbackDraft, publish } = (await req.json()) ?? {};
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
    }
    const found = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    if (!found[0] || found[0].assignmentId !== id) {
      return NextResponse.json({ error: "missing" }, { status: 404 });
    }

    if (publish) {
      await db
        .update(submissions)
        .set({
          score: score ?? found[0].score,
          feedback: feedbackDraft ?? found[0].feedbackDraft ?? found[0].feedback,
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, submissionId));
      return NextResponse.json({ published: true });
    }

    await db
      .update(submissions)
      .set({
        score: score ?? found[0].score,
        feedbackDraft: feedbackDraft ?? found[0].feedbackDraft,
        status: "marking",
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId));
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
