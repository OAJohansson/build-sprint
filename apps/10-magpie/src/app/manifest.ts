import type { MetadataRoute } from "next";

// Makes Magpie installable, and once installed on Android it shows up in the share sheet: a
// shared photo is POSTed to /share-target, where the service worker (public/sw.js) catches it
// and opens the capture details with it (R5). Pattern from Selvedge.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Magpie",
    short_name: "Magpie",
    description: "A sticker book of the food and drink you loved, kept by Maggie the magpie.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF4E0",
    theme_color: "#FFF4E0",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: { title: "title", text: "text", url: "url", files: [{ name: "files", accept: ["image/*"] }] },
    },
  };
}
