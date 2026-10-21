import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
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
