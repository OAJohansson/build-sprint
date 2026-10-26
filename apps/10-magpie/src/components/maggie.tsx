// Maggie the magpie, drawn as in the final-flow screens: a round black body, white belly and
// eyes, a butter beak, teal wing flash and tail, pink cheeks. One component, five poses.

type Pose = "hello" | "head" | "sit" | "cheer" | "draw";

export function Maggie({ pose, size, className, dark }: { pose: Pose; size: number; className?: string; dark?: boolean }) {
  const common = { width: size, height: size, className, "aria-hidden": true as const, focusable: false as const };
  if (pose === "hello") {
    return (
      <svg {...common} height={size * (116 / 120)} viewBox="0 0 120 116">
        <path d="M18 24l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFB938" />
        <path d="M100 30l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#F2705B" />
        <circle cx="96" cy="88" r="3" fill="#2E9A97" />
        <path d="M30 78q-14 8-10 26" stroke="#2E9A97" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="66" r="36" fill="#222" />
        <ellipse cx="63" cy="78" rx="19" ry="15" fill="#FFF" />
        <path d="M30 62q10-18 26-10" stroke="#2E9A97" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="51" cy="56" r="7" fill="#FFF" /><circle cx="52.5" cy="57" r="3.6" fill="#222" /><circle cx="54" cy="55.4" r="1.2" fill="#FFF" />
        <circle cx="73" cy="56" r="7" fill="#FFF" /><circle cx="74.5" cy="57" r="3.6" fill="#222" /><circle cx="76" cy="55.4" r="1.2" fill="#FFF" />
        <polygon points="56,66 68,66 62,74" fill="#FFB938" />
        <ellipse cx="40" cy="70" rx="5" ry="3" fill="#F7A9A0" /><ellipse cx="84" cy="70" rx="5" ry="3" fill="#F7A9A0" />
        <path d="M92 52q12-10 10-24" stroke="#222" strokeWidth="9" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (pose === "head") {
    return (
      <svg {...common} height={size * (44 / 48)} viewBox="0 0 48 44">
        <circle cx="24" cy="24" r="17" fill="#222" stroke={dark ? "#FFF4E0" : "none"} strokeWidth={dark ? 1.5 : 0} />
        <path d="M10 22q5-8 12-4" stroke="#2E9A97" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="19" cy="20" r="3.4" fill="#FFF" /><circle cx="20" cy="21" r="1.7" fill="#222" />
        <circle cx="30" cy="20" r="3.4" fill="#FFF" /><circle cx="31" cy="21" r="1.7" fill="#222" />
        <polygon points="22,25 29,25 25.5,29.5" fill="#FFB938" />
        <ellipse cx="14" cy="27" rx="2.6" ry="1.6" fill="#F7A9A0" /><ellipse cx="35" cy="27" rx="2.6" ry="1.6" fill="#F7A9A0" />
      </svg>
    );
  }
  if (pose === "sit") {
    return (
      <svg {...common} viewBox="0 0 48 48">
        <path d="M9 28q-7 5-5 14" stroke="#2E9A97" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="24" cy="26" r="17" fill="#222" />
        <ellipse cx="26" cy="32" rx="9" ry="7" fill="#FFF" />
        <path d="M10 24q5-8 12-4" stroke="#2E9A97" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="21" r="3.4" fill="#FFF" /><circle cx="20.6" cy="21.4" r="1.7" fill="#222" />
        <circle cx="31" cy="21" r="3.4" fill="#FFF" /><circle cx="31.6" cy="21.4" r="1.7" fill="#222" />
        <polygon points="23,26 30,26 26.5,30.5" fill="#FFB938" />
        <ellipse cx="15" cy="28" rx="2.6" ry="1.6" fill="#F7A9A0" /><ellipse cx="36" cy="28" rx="2.6" ry="1.6" fill="#F7A9A0" />
      </svg>
    );
  }
  if (pose === "cheer") {
    // Wings up, eyes squeezed happy: the saved moment. The sticker sits above her (drawn by the page).
    return (
      <svg {...common} height={size * (64 / 120)} viewBox="0 56 120 64">
        <path d="M28 98q-10 6-8 18" stroke="#2E9A97" strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="56" cy="92" r="24" fill="#222" />
        <ellipse cx="58" cy="100" rx="13" ry="10" fill="#FFF" />
        <path d="M32 82q-8-12-2-22" stroke="#222" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M80 82q8-12 2-22" stroke="#222" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M48 85q3-4 6 0" stroke="#FFF" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M60 85q3-4 6 0" stroke="#FFF" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <polygon points="53,90 61,90 57,95" fill="#FFB938" />
        <ellipse cx="42" cy="93" rx="3.4" ry="2" fill="#F7A9A0" />
        <ellipse cx="72" cy="93" rx="3.4" ry="2" fill="#F7A9A0" />
      </svg>
    );
  }
  // draw: Maggie below the sticker she's drawing, pencil in wing (the page draws the sticker).
  return (
    <svg {...common} height={size * (58 / 100)} viewBox="10 66 100 58">
      <path d="M28 108q-10 6-8 16" stroke="#2E9A97" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="98" r="22" fill="#222" />
      <ellipse cx="62" cy="106" rx="12" ry="9" fill="#FFF" />
      <circle cx="53" cy="92" r="4" fill="#FFF" /><circle cx="54" cy="91" r="2" fill="#222" />
      <circle cx="67" cy="92" r="4" fill="#FFF" /><circle cx="68" cy="91" r="2" fill="#222" />
      <polygon points="57,97 65,97 61,102" fill="#FFB938" />
      <path d="M78 92q10-8 14-22" stroke="#222" strokeWidth="8" fill="none" strokeLinecap="round" />
      <g transform="rotate(35 92 66)">
        <rect x="89" y="46" width="7" height="26" rx="1" fill="#FFB938" stroke="#3B1F1A" strokeWidth="1.2" />
        <polygon points="89,72 96,72 92.5,80" fill="#F7D9B5" stroke="#3B1F1A" strokeWidth="1.2" />
        <rect x="89" y="44" width="7" height="4" fill="#F2705B" stroke="#3B1F1A" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/** The design's little sparkles around Maggie on the saved screen. */
export function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" preserveAspectRatio="none">
      <path d="M14 30l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#FFD166" />
      <path d="M104 18l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFFFFF" />
      <path d="M100 96l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#FFD166" />
    </svg>
  );
}
