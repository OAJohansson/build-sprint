import type { MetadataRoute } from "next";

// Makes Selvedge installable, and once installed on Android it shows up in the share sheet: a
// share is POSTed to /share-target, where the service worker (public/sw.js) catches it.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Selvedge",
    short_name: "Selvedge",
    description: "Save the clothes you love from anywhere, and see your style together.",
    start_url: "/",
    display: "standalone",
    background_color: "#1d2733",
    theme_color: "#1d2733",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "files", accept: ["image/*"] }],
      },
    },
  };
}
