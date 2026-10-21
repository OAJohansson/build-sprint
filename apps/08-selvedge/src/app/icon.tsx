import { appIcon } from "@/lib/app-icon";

// The two sizes the web app manifest asks for, served at /icon/192 and /icon/512.
export function generateImageMetadata() {
  return [192, 512].map((s) => ({ id: String(s), size: { width: s, height: s }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return appIcon(Number(await id));
}
