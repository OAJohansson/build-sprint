import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Ears (L17, L18): essentia.upf.edu sends no CORS headers, so the Discogs-EffNet model and
      // its metadata are proxied same-origin.
      { source: "/models/:path*", destination: "https://essentia.upf.edu/models/:path*" },
    ];
  },
};

export default nextConfig;
