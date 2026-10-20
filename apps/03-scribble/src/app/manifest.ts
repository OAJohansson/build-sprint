import type { MetadataRoute } from "next";

// Makes Scribble installable: Add to Dock (Mac Safari) and Add to Home Screen (iPhone) open it
// in its own window with no browser bar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scribble",
    short_name: "Scribble",
    description: "A few sentences a day, and a reader who tells you what worked.",
    start_url: "/",
    display: "standalone",
    background_color: "#efe6d3",
    theme_color: "#efe6d3",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
