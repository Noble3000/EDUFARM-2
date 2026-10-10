import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { presignedUploadUrl } from "@/lib/storage/r2";

const ALLOW: Record<string, string[]> = {
  material: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg", "text/plain"],
  submission: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
  evidence: ["application/pdf", "image/png", "image/jpeg"],
  cover: ["image/png", "image/jpeg"],
};

const MAX: Record<string, number> = {
  material: 25 * 1024 * 1024,
  submission: 10 * 1024 * 1024,
  evidence: 10 * 1024 * 1024,
  cover: 5 * 1024 * 1024,
};

// Returns a short-lived direct-to-R2 PUT URL. Browser uploads straight to R2;
// the follow-up create call references the returned key.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
    const { purpose, contentType, size, ext } = (await req.json()) ?? {};
    if (!purpose || !ALLOW[purpose]) {
      return NextResponse.json({ error: "purpose material|submission|evidence|cover required." }, { status: 400 });
    }
    if (!contentType || !ALLOW[purpose].includes(contentType)) {
      return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
    }
    if (!size || size > MAX[purpose]) {
      return NextResponse.json(
        { error: `File too large (max ${MAX[purpose] / 1024 / 1024}MB).` },
        { status: 400 },
      );
    }
    const safeExt = (ext ?? "bin").toString().replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
    const key = `${purpose}/${user.id}/${crypto.randomUUID()}.${safeExt}`;
    const url = await presignedUploadUrl(key, contentType);
    return NextResponse.json({ url, key });
  } catch (e) {
    const msg = e instanceof Error && e.message.startsWith("R2") ? "Storage not configured yet." : "unavailable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
