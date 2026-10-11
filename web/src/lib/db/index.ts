import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres-js is lazy: no connection is opened at import/build time.
// A syntactically invalid DATABASE_URL (e.g. an unset placeholder) must not
// crash module evaluation — real queries fail gracefully at runtime instead.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/edufarm_dev";

function createClient() {
  try {
    return postgres(connectionString, { prepare: false, max: 5 });
  } catch {
    return postgres("postgres://localhost:5432/edufarm_dev", {
      prepare: false,
      max: 1,
    });
  }
}

const client = createClient();

export const db = drizzle(client, { schema });
export type Db = typeof db;
