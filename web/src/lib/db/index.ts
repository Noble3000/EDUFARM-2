import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres-js is lazy: no connection is opened at import/build time.
// Real connection happens on first query at runtime (dev/prod with DATABASE_URL).
const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/edufarm_dev";

const client = postgres(connectionString, { prepare: false, max: 5 });

export const db = drizzle(client, { schema });
export type Db = typeof db;
