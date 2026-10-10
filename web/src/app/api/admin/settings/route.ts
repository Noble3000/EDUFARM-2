import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, auditLog } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

async function current() {
  const rows = await db.select().from(settings).where(eq(settings.id, "site"));
  if (rows[0]) return rows[0];
  await db.insert(settings).values({ id: "site" });
  return (await db.select().from(settings).where(eq(settings.id, "site")))[0];
}

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    return NextResponse.json({ settings: await current() });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error || !("user" in gate)) return gate.error;
  const admin = (gate as { user: { id: string } }).user;
  try {
    const { siteName, supportEmail, maintenanceMode, defaultSession } = (await req.json()) ?? {};
    await current();
    await db
      .update(settings)
      .set({
        ...(siteName !== undefined ? { siteName: siteName.trim() || "EduFarm" } : {}),
        ...(supportEmail !== undefined ? { supportEmail: supportEmail.trim() || null } : {}),
        ...(maintenanceMode !== undefined ? { maintenanceMode: !!maintenanceMode } : {}),
        ...(defaultSession !== undefined ? { defaultSession: defaultSession.trim() || null } : {}),
      })
      .where(eq(settings.id, "site"));
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId: admin.id,
      action: "settings.update",
      entity: "settings",
      entityId: "site",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
