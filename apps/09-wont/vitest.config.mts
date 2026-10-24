// Unit tests for date, time and streak logic (decision 0011). Run with `pnpm test`.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Day logic is tested in the owner's zone, which has the 25 Oct 2026 clock change.
process.env.TZ = "Europe/Stockholm";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], env: { TZ: "Europe/Stockholm" } },
});
