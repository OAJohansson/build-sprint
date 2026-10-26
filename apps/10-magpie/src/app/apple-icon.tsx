import { appIcon } from "@/lib/app-icon";

// The home-screen icon on an iPhone (and Safari's "Add to Dock"), at Apple's 180 × 180.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180);
}
