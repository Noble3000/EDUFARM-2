import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { documentText, extractCourses } from "@/lib/extract";

// Parse a registration document and return EDITABLE candidates.
// Nothing is saved here — the student reviews/corrects, then confirms via
// POST /api/courses (PRD: extracted details are never auto-added/verified).
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let text: string;
    try {
      text = await documentText(bytes, file.type, file.name);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Could not read that file." },
        { status: 400 },
      );
    }
    if (!text.trim()) {
      return NextResponse.json(
        { error: "No readable text found (scanned images need OCR — type courses manually)." },
        { status: 422 },
      );
    }
    const candidates = extractCourses(text);
    return NextResponse.json({ candidates, found: candidates.length });
  } catch {
    return NextResponse.json({ error: "Extraction failed. Try again." }, { status: 502 });
  }
}
