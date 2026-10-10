import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Self-host on local device: standalone output for `node server.js` / PM2 / Caddy */
  output: "standalone",
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
