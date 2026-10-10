import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, auditLog, materials, qaThreads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const rows = await db.select().from(reports).orderBy(desc(reports.createdAt));
    return NextResponse.json({ reports: rows });
  } catch {
    return NextResponse.json({ reports: [], error: "unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error || !("user" in gate)) return gate.error;
  const admin = (gate as { user: { id: string } }).user;
  try {
    const { id, outcome, resolutionNote } = (await req.json()) ?? {};
    // outcome: dismissed | actioned (+ optional removal of the target)
    if (!id || !["dismissed", "actioned"].includes(outcome) || !resolutionNote?.trim()) {
      return NextResponse.json(
        { error: "id + dismissed|actioned + resolution note are required." },
        { status: 400 },
      );
    }
    const found = await db.select().from(reports).where(eq(reports.id, id));
    const report = found[0];
    if (!report) return NextResponse.json({ error: "missing" }, { status: 404 });

    if (outcome === "actioned") {
      // Remove the offending target where we own it (materials hide, threads delete).
      if (report.targetType === "material") {
        await db
          .update(materials)
          .set({ status: "draft" })
          .where(eq(materials.id, report.targetId));
      } else if (report.targetType === "thread") {
        await db.delete(qaThreads).where(eq(qaThreads.id, report.targetId));
      }
    }

    await db
      .update(reports)
      .set({ status: outcome, resolutionNote: resolutionNote.trim(), reviewerId: admin.id })
      .where(eq(reports.id, id));
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId: admin.id,
      action: `moderation.${outcome}`,
      entity: "report",
      entityId: id,
    });
    return NextResponse.json({ ok: true, outcome });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
