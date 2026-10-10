// One-time local seed: creates/promotes the first admin.
// Run AFTER migration with a real DATABASE_URL:
//   $env:DATABASE_URL="postgres://edufarm:***@localhost:5432/edufarm_prod"
//   npm run seed:admin -- admin@university.edu "Admin Name" "StrongPass123!"
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error('Usage: npm run seed:admin -- <email> "<name>" <password>');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// Lazy import better-auth only at runtime (needs DB + secret).
const { betterAuth } = await import("better-auth");
const { drizzleAdapter } = await import("better-auth/adapters/drizzle");

const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const db = drizzle(client, { schema });
const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
});

const existing = await db.select().from(schema.user).where(eq(schema.user.email, email));
if (existing[0]) {
  await db.update(schema.user).set({ role: "admin", status: "active" }).where(eq(schema.user.id, existing[0].id));
  console.log(`Promoted ${email} to admin.`);
} else {
  const res = await auth.api.signUpEmail({
    body: { email, password, name },
  });
  const user = (res as { user?: { id?: string } })?.user;
  if (!user?.id) throw new Error("Sign-up failed — check DATABASE_URL / password policy.");
  await db.update(schema.user).set({ role: "admin", status: "active" }).where(eq(schema.user.id, user.id));
  console.log(`Created admin ${email}. Verify the email if required, then sign in.`);
}
await client.end();
