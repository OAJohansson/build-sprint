"use client";

import { useState } from "react";
import { stickerShape, type Kind, type Yum } from "@/lib/yum";

// A yum's picture on the shelf: its sticker when drawn; until then (or if drawing failed) the
// original photo in a die-cut frame; with neither, a plain sticker for its kind. Stickers sit at
// a small tilt, alternating like stickers pressed in by hand (the design).

const TILTS = [-4, 3, -2, 4, 2, -3];
export const tiltOf = (n: number) => TILTS[n % TILTS.length];

export function Sticker({ yum, size, tilt = true, show = "auto" }: { yum: Yum; size: number; tilt?: boolean; show?: "auto" | "photo" }) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // A soft paper-coloured shape holds the place while the image loads, so the shelf never looks empty.
  const holder = loaded ? undefined : "#F6E3C6";
  const shape = stickerShape(yum.number);
  const style = { width: size, height: size, transform: tilt ? `rotate(${tiltOf(yum.number)}deg)` : undefined };
  if (show === "auto" && yum.sticker === "ready" && !broken) {
    // eslint-disable-next-line @next/next/no-img-element -- private, cookie-guarded image route
    return <img src={`/api/yums/${yum.id}/sticker?v=${yum.updatedAt}`} alt="" width={size} height={size} loading="lazy" decoding="async" style={{ ...style, background: holder, borderRadius: shape === "round" ? "50%" : `${Math.round(size * 0.24)}px` }} className="object-contain" onLoad={() => setLoaded(true)} onError={() => setBroken(true)} draggable={false} />;
  }
  if (yum.hasPhoto) {
    const radius = shape === "round" ? "50%" : `${Math.round(size * 0.26)}px`;
    return (
      <span className={`relative block flex-none ${yum.sticker === "drawing" && show === "auto" ? "drawing-pulse" : ""}`} style={{ ...style, borderRadius: radius, border: "2px solid var(--cocoa)", background: "#fff", padding: Math.max(3, Math.round(size * 0.06)) }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- private, cookie-guarded image route */}
        <img src={`/api/yums/${yum.id}/photo`} alt="" loading="lazy" decoding="async" onLoad={() => setLoaded(true)} className="h-full w-full object-cover" style={{ background: holder, borderRadius: shape === "round" ? "50%" : `${Math.round(size * 0.2)}px` }} draggable={false} />
      </span>
    );
  }
  return <KindSticker kind={yum.kind} shape={shape} size={size} style={style} pulse={yum.sticker === "drawing"} />;
}

/** A plain sticker for a kind (a glass, a bowl, an ice cream), in the design's hand-drawn style. */
export function KindSticker({ kind, shape, size, style, pulse }: { kind: Kind; shape: "round" | "square"; size: number; style?: React.CSSProperties; pulse?: boolean }) {
  const bg = kind === "drink" ? "#F7B5C6" : kind === "food" ? "#FFD9A0" : "#CFE8F7";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={style} className={pulse ? "drawing-pulse" : undefined}>
      {shape === "round" ? (
        <><circle cx="24" cy="24" r="23" fill="#FFFFFF" stroke="#3B1F1A" strokeWidth="1.5" /><circle cx="24" cy="24" r="19" fill={bg} /></>
      ) : (
        <><rect x="2" y="2" width="44" height="44" rx="12" fill="#FFFFFF" stroke="#3B1F1A" strokeWidth="1.5" /><rect x="6" y="6" width="36" height="36" rx="9" fill={bg} /></>
      )}
      {kind === "drink" && <><path d="M16 13h16l-3 22H19z" fill="#B8476B" stroke="#3B1F1A" strokeWidth="1.5" /><circle cx="30" cy="12" r="3.5" fill="#7A2A48" stroke="#3B1F1A" strokeWidth="1.5" /></>}
      {kind === "food" && <><ellipse cx="24" cy="30" rx="14" ry="6" fill="#FFFFFF" stroke="#3B1F1A" strokeWidth="1.5" /><ellipse cx="24" cy="28" rx="10" ry="4" fill="#C98A4B" /></>}
      {kind === "dessert" && <><path d="M17 24h14l-7 16z" fill="#E8C49A" stroke="#3B1F1A" strokeWidth="1.5" /><circle cx="24" cy="19" r="8" fill="#B5D98A" stroke="#3B1F1A" strokeWidth="1.5" /></>}
    </svg>
  );
}

/** Hearts as small outlined shapes, so they read on cream and white (coral alone is 2.7:1). */
export function Hearts({ n, size = 14, className }: { n: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[2px] ${className ?? ""}`} role="img" aria-label={`${n} of 5 hearts`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21l-8-8a5 5 0 0 1 8-6 5 5 0 0 1 8 6z" fill={i <= n ? "#F2705B" : "#FFFFFF"} stroke="#3B1F1A" strokeWidth="2" />
        </svg>
      ))}
    </span>
  );
}
