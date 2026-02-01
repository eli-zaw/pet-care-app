// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://pet-care-app.pages.dev", // zmień na swój URL
  output: "server",
  // Cloudflare adapter enables KV-backed Astro Sessions by default (binding `SESSION`).
  // We don't use Astro sessions in this app, so force an in-memory driver to avoid requiring KV bindings on Pages.
  session: {
    driver: "memory",
  },
  integrations: [react(), sitemap()],
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    mode: "directory",
  }),
});
