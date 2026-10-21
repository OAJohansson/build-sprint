import type { MetadataRoute } from "next";

// Makes Six AM installable: Add to Dock (Mac Safari, or Chrome's Install) and Add to Home Screen
// open it in its own window with no browser bar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Six AM",
    short_name: "Six AM",
    description: "Make house and techno from loops: drag sounds from the crate onto a timeline.",
    start_url: "/",
    display: "standalone",
    background_color: "#131110",
    theme_color: "#131110",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
