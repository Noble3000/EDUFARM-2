import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { lecturerVerifications, user, auditLog } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const rows = await db
      .select({ app: lecturerVerifications, applicant: user })
      .from(lecturerVerifications)
      .innerJoin(user, eq(lecturerVerifications.userId, user.id))
      .orderBy(desc(lecturerVerifications.createdAt));

    // Best-effort signed evidence links (work once R2 keys are set).
    const { presignedViewUrl } = await import("@/lib/storage/r2");
    const queue = await Promise.all(
      rows.map(async ({ app, applicant }) => {
        let evidenceUrls: string[] = [];
        try {
          evidenceUrls = await Promise.all(
            (app.evidencePaths ?? []).map((key: string) => presignedViewUrl(key)),
          );
        } catch {
          evidenceUrls = [];
        }
        return { app, applicant, evidenceUrls };
      }),
    );
    return NextResponse.json({ queue });
  } catch {
    return NextResponse.json({ queue: [], error: "unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error || !("user" in gate)) return gate.error;
  const admin = (gate as { user: { id: string } }).user;
  try {
    const { id, decision, note } = (await req.json()) ?? {};
    if (!id || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ error: "id + approved|rejected required." }, { status: 400 });
    }
    const found = await db
      .select()
      .from(lecturerVerifications)
      .where(eq(lecturerVerifications.id, id));
    const app = found[0];
    if (!app) return NextResponse.json({ error: "missing" }, { status: 404 });

    await db
      .update(lecturerVerifications)
      .set({ status: decision, reviewerId: admin.id, decidedAt: new Date(), note: note?.trim() || null })
      .where(eq(lecturerVerifications.id, id));
    // Approval gate (PRD acceptance): lecturer tools unlock only here.
    // Never touch admins: approving a row that points at an admin (e.g. a
    // self-test) must not demote them. Rejection returns non-admins to student.
    const target = (
      await db.select({ role: user.role }).from(user).where(eq(user.id, app.userId))
    )[0]?.role;
    if (target !== "admin") {
      await db
        .update(user)
        .set({ role: decision === "approved" ? "lecturer" : "student" })
        .where(eq(user.id, app.userId));
    }
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId: admin.id,
      action: `verification.${decision}`,
      entity: "lecturer_verification",
      entityId: id,
    });
    return NextResponse.json({ ok: true, decision });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
