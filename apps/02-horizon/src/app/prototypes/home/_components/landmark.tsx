import type { LandmarkId } from "../_lib/sky";

// Hand-drawn silhouettes in one style, standing on the bottom edge of a 400 × 200 box.

// Candi bentar: the split temple gate. Left half drawn, right half mirrored.
const GATE_HALF =
  "M104 200 V168 H112 V150 H120 V134 H128 V118 H136 V104 H144 V90 H152 V78 H160 V66 H167 V55 H173 V45 H178 V36 L182 22 L186 36 H190 V200 Z";

function BaliGate({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d={GATE_HALF} />
      <path d={GATE_HALF} transform="translate(400 0) scale(-1 1)" />
      {/* steps up to the gap */}
      <path d="M178 200 V194 H222 V200 Z M184 194 V189 H216 V194 Z" />
      {/* frangipani bushes and a palm either side */}
      <path d="M0 200 V186 Q20 174 42 182 Q60 172 80 184 Q92 180 104 186 V200 Z" />
      <path d="M296 186 Q312 176 330 184 Q352 172 372 182 Q388 176 400 182 V200 H296 Z" />
      <path d="M58 200 Q62 150 74 112 L77 113 Q66 152 63 200 Z" />
      <path d="M75 112 Q52 104 34 116 Q54 106 74 115 Q60 96 44 94 Q64 94 77 111 Q80 92 96 86 Q86 98 80 111 Q100 102 116 110 Q96 106 79 114 Z" />
      <path d="M352 200 Q348 160 336 128 L339 127 Q352 160 357 200 Z" />
      <path d="M337 128 Q318 118 302 126 Q320 120 336 131 Q326 112 312 108 Q330 110 339 126 Q344 110 358 106 Q348 116 341 128 Q358 122 372 130 Q356 124 340 131 Z" />
    </g>
  );
}

function Eiffel({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d="M156 200 L184 128 H190 L196 66 H198 L199 26 L200 10 L201 26 L202 66 H204 L210 128 H216 L244 200 H226 Q200 160 174 200 Z" />
      <rect x="178" y="124" width="44" height="6" />
      <rect x="192" y="62" width="16" height="5" />
      <path d="M0 200 V184 H40 V176 H70 V186 H120 V180 H150 V200 Z M250 200 V182 H290 V172 H320 V184 H360 V178 H400 V200 Z" />
    </g>
  );
}

function Hills({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d="M0 200 V170 Q60 148 130 166 T260 160 T400 168 V200 Z" opacity="0.55" />
      <path d="M0 200 V182 Q90 164 190 180 T400 178 V200 Z" />
    </g>
  );
}

export function Landmark({ id, fill, className, style }: { id: LandmarkId; fill: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax meet" className={className} style={style} aria-hidden="true">
      {id === "bali" ? <BaliGate fill={fill} /> : id === "paris" ? <Eiffel fill={fill} /> : <Hills fill={fill} />}
    </svg>
  );
}
