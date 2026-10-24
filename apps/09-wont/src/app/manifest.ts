import type { MetadataRoute } from "next";
import { copy } from "@/lib/copy";

// Lets the app be added to the home screen (no service worker: it needs the network once to load).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: copy.app.name,
    short_name: copy.app.name,
    description: copy.app.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f2ebde",
    theme_color: "#2a2420",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
