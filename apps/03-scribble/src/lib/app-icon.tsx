import { ImageResponse } from "next/og";

// The home-screen and Dock icon: a manuscript page with two typed lines and the red cursor.
// Drawn in code so every size comes from one design. The marks stay inside the middle 70%,
// so the icon also survives a circular or squircle mask.
export function appIcon(size: number) {
  const u = size / 100;
  const line = (width: number, color: string) => (
    <div style={{ width: width * u, height: 7 * u, background: color, borderRadius: 1.5 * u }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 9 * u,
          padding: `0 ${22 * u}px`,
          background: "radial-gradient(ellipse 90% 75% at 50% 38%, #f7f1e5 0%, #efe6d3 58%, #ddcfb4 100%)",
        }}
      >
        {line(56, "#26221e")}
        <div style={{ display: "flex", alignItems: "center", gap: 4 * u }}>
          {line(30, "#26221e")}
          <div style={{ width: 9 * u, height: 16 * u, background: "#8a2617" }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
