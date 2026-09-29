import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// the "@/…" path alias from tsconfig, so tests can import app code the same way
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
