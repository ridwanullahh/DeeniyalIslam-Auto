// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  server: {
    host: "0.0.0.0",
    port: 4321,
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // baileys pulls in lots of node-only deps; mark as external
      noExternal: [],
    },
    optimizeDeps: {
      include: ["zod", "nanoid", "cookie", "pino", "cron-parser"],
    },
  },
  // Trust the loopback proxy headers we control in production
  // (X-Forwarded-For, X-Forwarded-Proto).
  // Astro reads these when computing `Astro.url` and request.ip.
});
