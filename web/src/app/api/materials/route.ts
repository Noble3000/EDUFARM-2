import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { materials } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";
import { presignedViewUrl, presignedDownloadUrl } from "@/lib/storage/r2";

// Lecturer upload record: references an R2 key from /api/uploads/sign.
// Flow: draft → confirmed → published. Only confirmed+published gets the badge.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { courseId, title, type, session, filePath, allowDownload } = (await req.json()) ?? {};
    if (!courseId || !title?.trim() || !filePath) {
      return NextResponse.json({ error: "Course, title, and uploaded file are required." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await db.insert(materials).values({
      id,
      courseId,
      uploaderId: user.id,
      title: title.trim(),
      type: type || "note",
      session: session?.trim() || null,
      filePath,
      allowDownload: allowDownload ?? false,
      status: "draft",
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

// Confirm + publish (or back to draft). Sets confirming lecturer + timestamp.
export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { id, action, allowDownload } = (await req.json()) ?? {};
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    if (action === "confirm-publish") {
      await db
        .update(materials)
        .set({
          status: "published",
          confirmedBy: user.id,
          confirmedAt: new Date(),
          ...(allowDownload !== undefined ? { allowDownload } : {}),
        })
        .where(eq(materials.id, id));
    } else if (action === "to-draft") {
      await db.update(materials).set({ status: "draft" }).where(eq(materials.id, id));
    } else {
      return NextResponse.json({ error: "action confirm-publish|to-draft required." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function GET(req: Request) {
  // Signed access: ?id=&as=view|download — permission-checked here.
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "";
    const as = url.searchParams.get("as") === "download" ? "download" : "view";
    const found = await db.select().from(materials).where(eq(materials.id, id));
    const m = found[0];
    if (!m) return NextResponse.json({ error: "missing" }, { status: 404 });

    const staff = user.role === "lecturer" || user.role === "admin";
    const published = m.status === "published";
    if (!staff && !published) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (as === "download" && !m.allowDownload && !staff) {
      return NextResponse.json({ error: "Download not permitted by the lecturer." }, { status: 403 });
    }
    const filename = `${m.title.replace(/[^a-z0-9]+/gi, "-")}.pdf`;
    const signed =
      as === "download"
        ? await presignedDownloadUrl(m.filePath, filename)
        : await presignedViewUrl(m.filePath);
    return NextResponse.json({ url: signed });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
