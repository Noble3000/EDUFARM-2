import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { qaReplies } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ replies: [] }, { status: 401 });
    const { id } = await params;
    const replies = await db
      .select()
      .from(qaReplies)
      .where(eq(qaReplies.threadId, id));
    return NextResponse.json({ replies });
  } catch {
    return NextResponse.json({ replies: [], error: "unavailable" }, { status: 503 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { id } = await params;
    const { body } = (await req.json()) ?? {};
    if (!body?.trim()) {
      return NextResponse.json({ error: "Reply text is required." }, { status: 400 });
    }
    const replyId = crypto.randomUUID();
    await db.insert(qaReplies).values({ id: replyId, threadId: id, authorId: user.id, body: body.trim() });
    return NextResponse.json({ id: replyId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
