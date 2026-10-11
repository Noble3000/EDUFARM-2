import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lecturerVerifications, user } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

// Lecturer evidence submission: R2 keys from /api/uploads/sign (purpose=evidence)
// plus department. Creates (or refreshes) the pending verification row and gates
// the account to lecturer_pending until an admin decides.
export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "login" }, { status: 401 });
    // Role separation (PRD §3): only student/pending accounts enter lecturer
    // verification. Approved lecturers and admins never pass through here.
    const current = (
      await db.select({ role: user.role }).from(user).where(eq(user.id, sessionUser.id))
    )[0]?.role;
    if (current !== "student" && current !== "lecturer_pending") {
      return NextResponse.json({ error: "not eligible" }, { status: 403 });
    }
    const { evidencePaths, department } = (await req.json()) ?? {};
    if (!Array.isArray(evidencePaths) || evidencePaths.length === 0) {
      return NextResponse.json({ error: "Upload at least one evidence file." }, { status: 400 });
    }
    const existing = await db
      .select()
      .from(lecturerVerifications)
      .where(eq(lecturerVerifications.userId, sessionUser.id));

    if (existing[0]) {
      await db
        .update(lecturerVerifications)
        .set({
          evidencePaths,
          department: department?.trim() || existing[0].department,
          status: "pending",
          reviewerId: null,
          decidedAt: null,
          note: null,
        })
        .where(eq(lecturerVerifications.id, existing[0].id));
    } else {
      await db.insert(lecturerVerifications).values({
        id: crypto.randomUUID(),
        userId: sessionUser.id,
        evidencePaths,
        department: department?.trim() || null,
        status: "pending",
      });
    }
    await db
      .update(user)
      .set({ role: "lecturer_pending" })
      .where(eq(user.id, sessionUser.id));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
