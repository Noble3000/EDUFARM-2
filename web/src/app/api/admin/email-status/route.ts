import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { checkEmailProviders, sendEmail } from "@/lib/email";

// Admin-only email diagnostics (never exposes secrets).
// GET: live provider status on THIS server (Gmail SMTP login + Resend key).
// POST { to }: send a real test email to prove end-to-end delivery.
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const status = await checkEmailProviders();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  try {
    const { to } = (await req.json()) ?? {};
    if (!to || typeof to !== "string" || !/^\S+@\S+\.\S+$/.test(to.trim())) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    await sendEmail({
      to: to.trim(),
      subject: "EduFarm test email — delivery works",
      text: "This is a test from your EduFarm admin panel. If you can read this, verification codes will reach this inbox too.",
      html: "<p>This is a test from your EduFarm admin panel. If you can read this, verification codes will reach this inbox too.</p>",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
