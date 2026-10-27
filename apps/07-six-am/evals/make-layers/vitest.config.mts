// Make-layers reading spike (27 Oct 2026, L220): offline measurements, not unit tests. Run:
// pnpm -F 07-six-am exec vitest run --config evals/make-layers/vitest.config.mts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
  test: { include: ["evals/make-layers/*.eval.ts"], testTimeout: 600_000 },
});
