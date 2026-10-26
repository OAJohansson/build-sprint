import { ImageResponse } from "next/og";

// The home-screen icon: Maggie's face on butter yellow, inside the middle 70% so it survives a
// circular mask. Drawn in code so every size comes from one design.
const FACE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 40 40"><circle cx="24" cy="24" r="17" fill="#222"/><path d="M10 22q5-8 12-4" stroke="#2E9A97" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="19" cy="20" r="3.4" fill="#FFF"/><circle cx="20" cy="21" r="1.7" fill="#222"/><circle cx="30" cy="20" r="3.4" fill="#FFF"/><circle cx="31" cy="21" r="1.7" fill="#222"/><polygon points="22,25 29,25 25.5,29.5" fill="#FFB938"/><ellipse cx="14" cy="27" rx="2.6" ry="1.6" fill="#F7A9A0"/><ellipse cx="35" cy="27" rx="2.6" ry="1.6" fill="#F7A9A0"/></svg>`;

export function appIcon(size: number) {
  const face = Math.round(size * 0.66);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFB938" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered to PNG */}
        <img width={face} height={face} src={`data:image/svg+xml;utf8,${encodeURIComponent(FACE)}`} />
      </div>
    ),
    { width: size, height: size },
  );
}
