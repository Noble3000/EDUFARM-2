import { NextResponse } from "next/server";
import { eq, and, ne, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { devotionals } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const rows = await db.select().from(devotionals).orderBy(desc(devotionals.createdAt));
    return NextResponse.json({ devotionals: rows });
  } catch {
    return NextResponse.json({ devotionals: [], error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error || !("user" in gate)) return gate.error;
  const admin = (gate as { user: { id: string } }).user;
  try {
    const { title, verseRef, body, prayer, publishAt, showOnLanding } = (await req.json()) ?? {};
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const status = publishAt && new Date(publishAt) > new Date() ? "scheduled" : "draft";
    await db.insert(devotionals).values({
      id,
      title: title.trim(),
      verseRef: verseRef?.trim() || null,
      body: body.trim(),
      prayer: prayer?.trim() || null,
      status,
      publishAt: publishAt ? new Date(publishAt) : null,
      showOnLanding: showOnLanding ?? true,
      authorId: admin.id,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const { id, action, title, verseRef, body, prayer, publishAt, showOnLanding } = (await req.json()) ?? {};
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

    if (action === "publish") {
      // One live devotional at a time: retire any other published ones first.
      // History is retained — retired rows stay in the table as "hidden".
      await db
        .update(devotionals)
        .set({ status: "hidden", showOnLanding: false, updatedAt: new Date() })
        .where(and(eq(devotionals.status, "published"), ne(devotionals.id, id)));
      await db
        .update(devotionals)
        .set({ status: "published", showOnLanding: true, publishAt: new Date(), updatedAt: new Date() })
        .where(eq(devotionals.id, id));
    } else if (action === "unpublish") {
      await db
        .update(devotionals)
        .set({ status: "hidden", showOnLanding: false, updatedAt: new Date() })
        .where(eq(devotionals.id, id));
    } else if (action === "edit") {
      await db
        .update(devotionals)
        .set({
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(verseRef !== undefined ? { verseRef: verseRef.trim() || null } : {}),
          ...(body !== undefined ? { body: body.trim() } : {}),
          ...(prayer !== undefined ? { prayer: prayer.trim() || null } : {}),
          ...(publishAt !== undefined ? { publishAt: publishAt ? new Date(publishAt) : null } : {}),
          ...(showOnLanding !== undefined ? { showOnLanding } : {}),
          updatedAt: new Date(),
        })
        .where(eq(devotionals.id, id));
    } else {
      return NextResponse.json({ error: "action publish|unpublish|edit required." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
