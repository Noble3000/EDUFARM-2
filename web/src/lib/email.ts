// Central email sender: Resend via REST when configured, console log in dev.
// No extra dependency needed. Keys stay server-side.

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "EduFarm <no-reply@example.com>";

  // Dev fallback: log so signup still works without a provider.
  // The OTP also appears in the server terminal as [auth] OTP for <email>: <code>.
  if (!apiKey) {
    console.log(`[email:dev] to=${opts.to} subject=${opts.subject}`);
    return;
  }

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
    // Don't throw: OTP is still stored and valid; user can resend.
    // Throwing here would break signup on transient email outages.
  }
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
