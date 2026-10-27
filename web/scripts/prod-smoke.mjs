// End-to-end production smoke test. Runs during a Vercel build ONLY when
// RUN_PROD_SMOKE=1, so normal deploys skip it. It creates a throwaway
// account, proves the full auth + admin + storage chain against the live
// alias, then deletes every row and object it created.
//
// Always exits 0 so a failing check never blocks a deployment; the results
// are printed to the (private) build log.
import postgres from "postgres";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ENABLED = process.env.RUN_PROD_SMOKE === "1";
if (!ENABLED) {
  console.log("[smoke] skipped (RUN_PROD_SMOKE is not 1)");
  process.exit(0);
}

const BASE = process.env.SMOKE_BASE_URL ?? "https://edufarm-2.vercel.app";
const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!dbUrl) {
  console.log("[smoke] DATABASE_URL is not set; skipping.");
  process.exit(0);
}

const stamp = Date.now();
const email = `prod-smoke-${stamp}@example.com`;
const password = `Smoke-${stamp}-Aa1!`;

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`[smoke] ${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, init = {}) {
  return fetch(BASE + path, {
    ...init,
    headers: {
      origin: BASE,
      "user-agent": "edufarm-smoke/1.0",
      ...(init.headers ?? {}),
    },
  });
}

const sql = postgres(dbUrl, { prepare: false, max: 1 });
let userId = null;
let uploadKey = null;

try {
  // 1) Sign up a throwaway account through the public API.
  let res = await api("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Prod Smoke", email, password }),
  });
  const signupText = await res.text();
  check("signup creates account", res.ok, `${res.status} ${signupText.slice(0, 120)}`);

  const found = await sql`select id from "user" where email = ${email} limit 1`;
  userId = found[0]?.id ?? null;
  check("account persisted to Postgres", !!userId, userId ?? "not found");

  // 2) The 6-digit code must be stored where the app can read it back.
  const otpRows = await sql`
    select identifier, value from verification
     where identifier like ${"%" + email + "%"}
     order by created_at desc limit 1
  `;
  const otp = otpRows[0]?.value ?? "";
  check("verification code issued", /^\d{6}$/.test(otp), otpRows[0]?.identifier ?? "none");

  // 3) Verify the address with the code (the same call the register page makes).
  res = await api("/api/auth/email-otp/verify-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  check("email verification accepted", res.ok, `${res.status}`);

  // 4) Sign in with email + password and capture the session cookie.
  res = await api("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const jar = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const cookie = jar.map((c) => c.split(";")[0]).join("; ");
  check("password login issues a session", res.ok && !!cookie, `${res.status} cookies=${jar.length}`);

  // 5) Session resolves to the right user with the default student role.
  res = await api("/api/me", { headers: { cookie, accept: "application/json" } });
  let me = await res.json().catch(() => null);
  check("session resolves user", res.status === 200 && !!me?.user?.email, `${res.status} ${me?.user?.email ?? ""}`);
  check("default role is student", me?.user?.role === "student", `role=${me?.user?.role}`);

  // 6) A student must be refused by the admin gate.
  res = await api("/api/admin/overview", { headers: { cookie } });
  check("admin gate rejects student", res.status === 401 || res.status === 403, `${res.status}`);

  // 7) Promote to admin and confirm the gate now opens.
  await sql`update "user" set role = 'admin', email_verified = true, status = 'active' where id = ${userId}`;

  res = await api("/api/me", { headers: { cookie, accept: "application/json" } });
  me = await res.json().catch(() => null);
  check("role change visible to session", me?.user?.role === "admin", `role=${me?.user?.role}`);

  res = await api("/api/admin/overview", { headers: { cookie, accept: "application/json" } });
  const overviewText = await res.text();
  check("admin API authorises admin", res.status === 200, `${res.status} ${overviewText.slice(0, 90)}`);

  res = await api("/api/admin/users", { headers: { cookie, accept: "application/json" } });
  check("admin users API authorises admin", res.status === 200, `${res.status}`);

  // 8) Storage: presign, real PUT to R2, then delete the object.
  res = await api("/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ purpose: "material", contentType: "text/plain", size: 13, ext: "txt" }),
  });
  const signed = await res.json().catch(() => null);
  uploadKey = signed?.key ?? null;
  check("storage presign works", res.status === 200 && !!signed?.url, `${res.status} key=${uploadKey ?? "none"}`);

  if (signed?.url) {
    const put = await fetch(signed.url, {
      method: "PUT",
      headers: { "content-type": "text/plain" },
      body: "edufarm smoke",
    });
    check("R2 accepts upload", put.ok, `${put.status}`);

    try {
      const s3 = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: uploadKey }));
      uploadKey = null;
      check("R2 object cleanup", true, "deleted");
    } catch (e) {
      check("R2 object cleanup", false, e instanceof Error ? e.message.slice(0, 120) : "error");
    }
  }

  // 9) Email provider reports its state (does not send anything).
  res = await api("/api/admin/email-status", { headers: { cookie, accept: "application/json" } });
  check("email provider status reachable", res.status === 200, `${res.status} ${(await res.text()).slice(0, 120)}`);
} catch (e) {
  check("smoke run completed without throwing", false, e instanceof Error ? e.message.slice(0, 200) : "unknown");
} finally {
  // Remove every trace of the throwaway account.
  try {
    if (userId) {
      await sql`delete from session where user_id = ${userId}`;
      await sql`delete from account where user_id = ${userId}`;
      await sql`delete from "user" where id = ${userId}`;
    }
    await sql`delete from verification where identifier like ${"%" + email + "%"}`;
    const left = await sql`select count(*)::int as n from "user" where email = ${email}`;
    check("throwaway account removed", (left[0]?.n ?? 0) === 0, `remaining=${left[0]?.n}`);
  } catch (e) {
    console.log(`[smoke] cleanup error: ${e instanceof Error ? e.message : e}`);
  }
  await sql.end();
  console.log(`[smoke] RESULT passed=${passed} failed=${failed} (${BASE})`);
}
