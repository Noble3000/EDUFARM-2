// Runs during Vercel builds (see package.json "vercel-build").
// Idempotent: promotes the owner account whenever it exists. Safe no-op
// before the account has been registered.
import postgres from "postgres";

const email = (process.env.ADMIN_EMAIL ?? "nobleonwuka30@gmail.com").trim();
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  console.log("[admin] DATABASE_URL is not set; skipping admin promotion.");
  process.exit(0);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  const rows = await sql`
    update "user"
       set role = 'admin',
           status = 'active',
           email_verified = true,
           updated_at = now()
     where lower(email) = lower(${email})
     returning id, email
  `;
  if (rows.length) {
    console.log(`[admin] promoted ${rows[0].email} to admin.`);
  } else {
    console.log(`[admin] ${email} is not registered yet; nothing to promote.`);
    // Diagnostics: private build log, helps confirm which address was used.
    const all = await sql`
      select email, role, status, email_verified, created_at
        from "user"
       order by created_at asc
       limit 10
    `;
    console.log(`[admin] registered users: ${all.length}`);
    for (const u of all) {
      console.log(
        `[admin]   ${u.email} role=${u.role} status=${u.status} verified=${u.email_verified} created=${u.created_at?.toISOString?.() ?? u.created_at}`,
      );
    }
  }
} finally {
  await sql.end();
}
