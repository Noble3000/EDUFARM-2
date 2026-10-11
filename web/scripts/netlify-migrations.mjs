// Mirror drizzle SQL migrations into Netlify Database's migrations directory.
// Netlify applies files under netlify/database/migrations automatically on
// every production deploy (and per deploy-preview branch), so the hosted
// schema never drifts from the code. Run after every `db:generate`:
//   npm run db:netlify
// Local dev is unaffected: `db:migrate` still reads ./drizzle.
import { readdirSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(webDir, "drizzle");
const to = join(webDir, "netlify", "database", "migrations");
mkdirSync(to, { recursive: true });

let copied = 0;
for (const f of readdirSync(from)) {
  if (!f.endsWith(".sql")) continue; // skip drizzle meta/journal
  copyFileSync(join(from, f), join(to, f));
  copied++;
}
console.log(`mirrored ${copied} migration(s) to netlify/database/migrations`);
