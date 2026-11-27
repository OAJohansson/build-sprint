// Unit tests for date, time and streak logic (decision 0011). Run with `pnpm test`.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // shortcut: one 30 s budget for every test, because the audio-reader tests render seconds of sound and ran 6–8 s on a slow CI runner (27 Nov); split out a slow suite if the run gets long.
  test: { include: ["src/**/*.test.ts"], testTimeout: 30_000 },
});
