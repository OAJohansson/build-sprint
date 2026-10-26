import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp's native addon loads libvips (libvips-cpp.so) at run time in a way Next's file tracer
  // can't see, so on Vercel the function had sharp but not libvips (ERR_DLOPEN_FAILED, 26 Oct).
  // Ship the libvips package for whichever platform the build ran on, for every API route.
  outputFileTracingIncludes: {
    "/api/**/*": ["../../node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/lib/**/*"],
  },
};

export default nextConfig;
