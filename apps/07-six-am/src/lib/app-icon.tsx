import { ImageResponse } from "next/og";

// The home-screen and Dock icon: the favicon's record with the striped sun label, on the
// warehouse background. Drawn in code so every size comes from one design; the label sits well
// inside the middle 70%, so the icon survives a circular or squircle mask.
export function appIcon(size: number) {
  const u = size / 100;
  const ring = (d: number) => (
    <div
      style={{
        position: "absolute",
        width: d * u,
        height: d * u,
        borderRadius: "50%",
        border: `${1.2 * u}px solid #1f1b18`,
      }}
    />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#131110",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 84 * u,
            height: 84 * u,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#0b0a09",
            border: `${1.6 * u}px solid #3a322c`,
          }}
        >
          {ring(70)}
          {ring(58)}
          <div
            style={{
              width: 42 * u,
              height: 42 * u,
              display: "flex",
              flexDirection: "column",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            {["#f2b134", "#ef5b37", "#23b3a5", "#a9c95a"].map((c) => (
              <div key={c} style={{ flex: 1, background: c }} />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              width: 5 * u,
              height: 5 * u,
              borderRadius: "50%",
              background: "#0b0a09",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
