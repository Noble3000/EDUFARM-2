// Central email sender. Priority: ZeptoMail SMTP (transactional-grade,
// primary once its domain verifies) → Gmail SMTP (free, reaches any inbox,
// no domain needed) → Resend (verified domain reaches all; test sender
// reaches the owner only) → dev log (no provider). Secrets stay server-side.
//
// Serverless note (Netlify Functions): SMTP can be slow/blocked from cloud
// IPs, so sends carry tight timeouts and every outcome is logged with an
// actionable tag: skipped (no creds) vs failed (reason).

import nodemailer from "nodemailer";

export type ProviderStatus = {
  configured: boolean;
  ok: boolean;
  detail: string;
};

async function sendViaZepto(opts: { to: string; subject: string; html: string; text?: string }) {
  const token = (process.env.ZEPTO_SMTP_TOKEN ?? "").replace(/ /g, "");
  const fromAddr = process.env.ZEPTO_FROM ?? "";
  if (!token || !fromAddr) {
    console.log("[email] ZeptoMail skipped (ZEPTO_SMTP_TOKEN / ZEPTO_FROM not set).");
    return false;
  }
  // ZeptoMail SMTP: 587 + STARTTLS recommended; username is always emailapikey.
  const transport = nodemailer.createTransport({
    host: "smtp.zeptomail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: "emailapikey", pass: token },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  await transport.sendMail({
    from: `EduFarm <${fromAddr}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return true;
}

async function sendViaGmail(opts: { to: string; subject: string; html: string; text?: string }) {
  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/ /g, "");
  if (!user || !pass) {
    console.log("[email] Gmail skipped (GMAIL_USER / GMAIL_APP_PASSWORD not set).");
    return false;
  }
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
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
  if (!apiKey) {
    console.log("[email] Resend skipped (RESEND_API_KEY not set).");
    return false;
  }
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

// Admin diagnostics: which providers can actually deliver from THIS server?
// Never returns secrets — only configured/reachable booleans + short reasons.
export async function checkEmailProviders(): Promise<{
  gmail: ProviderStatus;
  resend: ProviderStatus;
}> {
  const gmailUser = process.env.GMAIL_USER ?? "";
  const gmailPass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/ /g, "");
  let gmail: ProviderStatus;
  if (!gmailUser || !gmailPass) {
    gmail = { configured: false, ok: false, detail: "GMAIL_USER / GMAIL_APP_PASSWORD not set on this server." };
  } else if (!/^[a-z]{16}$/i.test(gmailPass)) {
    gmail = { configured: true, ok: false, detail: "App password must be exactly 16 letters (no spaces)." };
  } else {
    try {
      const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      await transport.verify();
      gmail = { configured: true, ok: true, detail: `SMTP login ok as ${gmailUser} — can send to any inbox.` };
    } catch (e) {
      gmail = { configured: true, ok: false, detail: `SMTP login failed: ${e instanceof Error ? e.message.slice(0, 160) : e}` };
    }
  }

  const resendKey = process.env.RESEND_API_KEY ?? "";
  let resend: ProviderStatus;
  if (!resendKey) {
    resend = { configured: false, ok: false, detail: "RESEND_API_KEY not set on this server." };
  } else {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      if (res.status === 401 || res.status === 403) {
        resend = { configured: true, ok: false, detail: `Resend rejected the key (${res.status}) — generate a new one.` };
      } else {
        const from = process.env.EMAIL_FROM ?? "";
        const testMode = from.includes("onboarding@resend.dev") || from.includes("example.com");
        resend = {
          configured: true,
          ok: true,
          detail: testMode
            ? "Key valid, but test sender reaches ONLY your own email. Verify a domain to reach everyone."
            : "Key valid and sender domain set — reaches any inbox.",
        };
      }
    } catch (e) {
      resend = { configured: true, ok: false, detail: `Could not reach Resend: ${e instanceof Error ? e.message.slice(0, 120) : e}` };
    }
  }
  return { gmail, resend };
}
