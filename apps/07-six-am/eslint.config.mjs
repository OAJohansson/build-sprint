import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // evals/: graders' scripts; src/app/prototypes/: throwaway design prototypes (deleted after the build).
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "evals/**", "src/app/prototypes/**"]),
]);
