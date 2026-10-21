import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const githubPagesBase = "/goonki-kong-country/";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? githubPagesBase : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@game3d": fileURLToPath(new URL("./src/game3d", import.meta.url)),
    },
  },
  server: { port: 5174, strictPort: true },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  build: { chunkSizeWarningLimit: 1400 },
});
