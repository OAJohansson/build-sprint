// Lab evals (data-evals, 26 Oct 2026): offline graders, not unit tests. Run:
// pnpm -F 07-six-am exec vitest run --config evals/lab/vitest.config.mts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
  test: { include: ["evals/lab/*.eval.ts"], testTimeout: 600_000 },
});
