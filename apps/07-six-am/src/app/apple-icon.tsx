import { appIcon } from "@/lib/app-icon";

// iPhone home screen and the macOS Dock (Safari's Add to Dock) read this one.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180);
}
