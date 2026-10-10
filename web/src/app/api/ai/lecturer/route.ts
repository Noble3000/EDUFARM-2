import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiUsage } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth-helpers";
import { chat } from "@/lib/ai/gateway";

// Lecturer draft tool: outlines, summaries, assignment/test + marking-guide
// drafts. ALWAYS returns a draft for human review — never publishes anything.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "lecturer" && user.role !== "admin")) {
      return NextResponse.json({ error: "lecturer" }, { status: 403 });
    }
    const { kind, brief } = (await req.json()) ?? {};
    if (!brief?.trim()) {
      return NextResponse.json({ error: "Describe what to draft first." }, { status: 400 });
    }
    const kinds: Record<string, string> = {
      outline: "Draft a lesson outline with objectives, sections, and timings.",
      summarize: "Summarize and adapt the teaching material below for class level.",
      assignment: "Draft an assignment brief with instructions, deliverables, and deadline guidance.",
      questions: "Draft practice/test questions (mixed difficulty) with an answer key.",
      marking: "Draft a marking guide with criteria, mark allocation, and exemplar notes.",
    };
    const instruction = kinds[kind as string] ?? kinds.outline;

    const { text, tokens } = await chat(
      [
        {
          role: "system",
          content: `You assist university lecturers. ${instruction}\nEnd with a 3-line review checklist. Never address students directly; this is a staff draft.`,
        },
        { role: "user", content: brief.trim() },
      ],
      { maxTokens: 1200 },
    );

    try {
      await db.insert(aiUsage).values({
        id: crypto.randomUUID(),
        userId: user.id,
        scope: "lecturer-draft",
        tokens,
      });
    } catch {
      /* non-blocking */
    }
    return NextResponse.json({ draft: text, aiGenerated: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unavailable";
    const status = msg.includes("not configured") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
