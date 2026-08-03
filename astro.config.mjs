import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://greenways.ai",
  output: "static",
  integrations: [sitemap()],
  build: { format: "directory" },
  vite: { build: { assetsInlineLimit: 0 } }
});
