// Runs during Vercel builds (see package.json "vercel-build").
// Idempotent: promotes the owner account(s) whenever they exist. Safe no-op
// before an account has been registered.
import postgres from "postgres";

// Canonical owner address. The account was first registered under a mistyped
// address (nobleonwuka20@) and later corrected to this one, which is the only
// address that should be auto-promoted.
const OWNER_EMAILS = ["nobleonwuka30@gmail.com"];
// Accounts that must never hold admin. The first registration used a mistyped
// address before it was corrected to the canonical one.
const RETIRED_EMAILS = ["nobleonwuka20@gmail.com"];
if (process.env.ADMIN_EMAIL) OWNER_EMAILS.unshift(process.env.ADMIN_EMAIL.trim());
const owners = [...new Set(OWNER_EMAILS.map((e) => e.toLowerCase()))];

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.log("[admin] DATABASE_URL is not set; skipping admin promotion.");
  process.exit(0);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  for (const email of owners) {
    const rows = await sql`
      update "user"
         set role = 'admin',
             status = 'active',
             email_verified = true,
             updated_at = now()
       where lower(email) = ${email}
       returning id, email
    `;
    if (rows.length) {
      console.log(`[admin] promoted ${rows[0].email} to admin.`);
    } else {
      console.log(`[admin] ${email} is not registered; nothing to promote.`);
    }
  }

  for (const email of RETIRED_EMAILS.map((e) => e.toLowerCase())) {
    const rows = await sql`
      update "user"
         set role = 'student',
             updated_at = now()
       where lower(email) = ${email}
         and role = 'admin'
       returning email
    `;
    if (rows.length) {
      console.log(`[admin] demoted ${rows[0].email} to student.`);
    }
  }

  const admins = await sql`
    select email from "user" where role = 'admin' order by created_at asc
  `;
  console.log(
    `[admin] current admins (${admins.length}): ${admins.map((a) => a.email).join(", ") || "none"}`,
  );

  // Test accounts created by scripts/prod-smoke.mjs or one-off delivery checks
  // must never linger in production. Exact patterns only — no real user match.
  const junk = await sql`
    delete from "user"
     where email like 'prod-smoke-%@example.com'
        or email like 'ef-test-%@maxxspace.com'
        or email = 'nobleonwuka30+edufarmtest@gmail.com'
     returning email
  `;
  if (junk.length) {
    console.log(`[admin] removed ${junk.length} test account(s): ${junk.map((r) => r.email).join(", ")}`);
  }
} finally {
  await sql.end();
}
