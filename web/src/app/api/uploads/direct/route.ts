import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { getSessionUser } from "@/lib/auth-helpers";

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

// Browser -> app server -> R2. Same-origin, so no bucket CORS is ever needed.
// (The presigned-PUT flow in /api/uploads/sign stays for scripts/large files.)
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

    const form = await req.formData();
    const purpose = String(form.get("purpose") ?? "");
    const file = form.get("file");
    if (!purpose || !ALLOW[purpose]) {
      return NextResponse.json({ error: "purpose material|submission|evidence|cover required." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
    }
    if (!ALLOW[purpose].includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
    }
    if (file.size > MAX[purpose]) {
      return NextResponse.json(
        { error: `File too large (max ${MAX[purpose] / 1024 / 1024}MB).` },
        { status: 400 },
      );
    }

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return NextResponse.json({ error: "Storage not configured yet." }, { status: 503 });
    }

    const ext = (file.name.split(".").pop() ?? "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
    const key = `${purpose}/${user.id}/${crypto.randomUUID()}.${ext}`;
    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }),
    );
    return NextResponse.json({ key }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });
  }
}
