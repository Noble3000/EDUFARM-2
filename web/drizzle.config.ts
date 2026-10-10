import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit reads env at CLI time; never commit real credentials
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/edufarm_dev",
  },
});
