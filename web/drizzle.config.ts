import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit reads env at CLI time; never commit real credentials.
    // Hosted Neon exposes a direct (unpooled) URL, which is the safe choice
    // for migrations. The app runtime keeps using the pooled DATABASE_URL.
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "postgres://localhost:5432/edufarm_dev",
  },
});
