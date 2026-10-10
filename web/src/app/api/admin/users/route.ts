import { NextResponse } from "next/server";
import { eq, desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, auditLog } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    const all = q
      ? await db
          .select()
          .from(user)
          .where(or(ilike(user.email, `%${q}%`), ilike(user.name, `%${q}%`)))
          .orderBy(desc(user.createdAt))
      : await db.select().from(user).orderBy(desc(user.createdAt));
    // Never leak password hashes (account table is never selected here by design).
    return NextResponse.json({
      users: all.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ users: [], error: "unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error || !("user" in gate)) return gate.error;
  const admin = (gate as { user: { id: string } }).user;
  try {
    const { userId, status } = (await req.json()) ?? {};
    if (!userId || !["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "userId + active|suspended required." }, { status: 400 });
    }
    await db.update(user).set({ status }).where(eq(user.id, userId));
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorId: admin.id,
      action: `user.${status}`,
      entity: "user",
      entityId: userId,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
