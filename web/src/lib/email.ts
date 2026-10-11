// Central email sender. Priority: Gmail SMTP (free, reaches any inbox,
// no domain needed) → Resend (needs verified domain for non-owner mail)
// → dev log (no provider). Secrets stay server-side.

import nodemailer from "nodemailer";

async function sendViaGmail(opts: { to: string; subject: string; html: string; text?: string }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transport.sendMail({
    from: `EduFarm <${user}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return true;
}

async function sendViaResend(opts: { to: string; subject: string; html: string; text?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from = process.env.EMAIL_FROM ?? "EduFarm <no-reply@example.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] Resend failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return true;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  // 1) Gmail first — works to any inbox without a domain.
  try {
    if (await sendViaGmail(opts)) return;
  } catch (e) {
    console.error(`[email] Gmail failed: ${e instanceof Error ? e.message.slice(0, 200) : e}`);
    // Fall through to Resend so one provider's outage never blocks signup.
  }
  // 2) Resend (test sender reaches the account owner; verified domain reaches all).
  if (await sendViaResend(opts)) return;
  // 3) Dev fallback: log so signup still works without a provider.
  // The OTP also appears in the server terminal as [auth] OTP for <email>: <code>.
  console.log(`[email:dev] to=${opts.to} subject=${opts.subject}`);
}

export async function sendVerificationCodeEmail(to: string, otp: string) {
  const minutes = 10;
  await sendEmail({
    to,
    subject: `Your EduFarm verification code: ${otp}`,
    text: `Your EduFarm verification code is ${otp}. It expires in ${minutes} minutes. Enter it in the app to verify your email — you will be logged in immediately after. If you did not request this, ignore this email.`,
    html: `<div style="font-family:sans-serif;max-width:480px"><h2>Your EduFarm code: ${otp}</h2><p>Enter this 6-digit code in the app to verify your email. It expires in ${minutes} minutes — you will be logged in immediately after.</p><p style="color:#666;font-size:13px">If you did not request this, ignore this email.</p></div>`,
  });
}
