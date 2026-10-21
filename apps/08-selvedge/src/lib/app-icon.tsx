import { ImageResponse } from "next/og";

// The home-screen icon: raw indigo denim with its selvedge edge (the white band and red line
// along a jean's outseam). Drawn in code so every size comes from one design; the stripe sits
// inside the middle 70%, so it survives a circular mask.
export function appIcon(size: number) {
  const u = size / 100;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1d2733" }}>
        <div style={{ marginLeft: 56 * u, width: 9 * u, height: "100%", display: "flex", background: "#efe9dc" }}>
          <div style={{ marginLeft: 3.5 * u, width: 2 * u, height: "100%", background: "#c23a2b" }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
