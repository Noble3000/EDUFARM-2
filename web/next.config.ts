import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Netlify serves the default build output. Local prod can still run
     `npm run build && npm start` (needs node_modules present). */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
