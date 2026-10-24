// Lets plain Node (type stripping, Node ≥ 22.18) run the app's TS from scripts: maps "@/x" to
// src/x.ts and adds ".ts" to extensionless relative imports, like Next's bundler does. No deps.
//   node --import ./scripts/ts-resolve.mjs scripts/loops-bakeoff.mjs …
import { existsSync } from "node:fs";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!globalThis.__sixamTsHook) {
  globalThis.__sixamTsHook = true;
  register(import.meta.url);
}

const src = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith("@/")) spec = new URL(spec.slice(2), src).href;
  else if (spec.startsWith(".") && context.parentURL) spec = new URL(spec, context.parentURL).href;
  if (spec.startsWith("file:") && !/\.[cm]?[jt]sx?$/.test(spec)) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const p = fileURLToPath(spec + ext);
      if (existsSync(p)) return next(pathToFileURL(p).href, context);
    }
  }
  return next(spec, context);
}
