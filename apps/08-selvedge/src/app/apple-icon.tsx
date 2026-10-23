import { appIcon } from "@/lib/app-icon";

// The icon Safari uses for "Add to Dock" on a Mac (and the home screen on an iPhone); without it
// Safari falls back to a screenshot. Same denim-and-selvedge design, at Apple's 180 × 180.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180);
}
