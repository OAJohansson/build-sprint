import type { LandmarkId } from "@/lib/landmarks";

// Hand-drawn silhouettes in one style, standing on the bottom edge of a 400 × 200 box.

// Candi bentar, the Balinese split gate: left half drawn, right half mirrored.
const GATE_HALF =
  "M104 200 V168 H112 V150 H120 V134 H128 V118 H136 V104 H144 V90 H152 V78 H160 V66 H167 V55 H173 V45 H178 V36 L182 22 L186 36 H190 V200 Z";
const PALM_L =
  "M58 200 Q62 150 74 112 L77 113 Q66 152 63 200 Z M75 112 Q52 104 34 116 Q54 106 74 115 Q60 96 44 94 Q64 94 77 111 Q80 92 96 86 Q86 98 80 111 Q100 102 116 110 Q96 106 79 114 Z";

// A spruce: stacked tiers narrowing to a point.
const spruce = (x: number, top: number, h: number) => {
  const w = h * 0.36;
  const tiers = 4;
  let d = `M${x} ${top}`;
  for (let i = 1; i <= tiers; i++) {
    const y = top + (h * 0.86 * i) / tiers;
    const half = (w / 2) * (i / tiers);
    d += ` L${x + half} ${y} L${x + half * 0.55} ${y}`;
  }
  d += ` L${x + 2} ${top + h * 0.86} V${top + h} H${x - 2} V${top + h * 0.86}`;
  for (let i = tiers; i >= 1; i--) {
    const y = top + (h * 0.86 * i) / tiers;
    const half = (w / 2) * (i / tiers);
    d += ` L${x - half * 0.55} ${y} L${x - half} ${y}`;
  }
  return d + " Z";
};

// A Forest Sami kåta: low walls under a steep pyramid roof.
const kata = (x: number, w: number, h: number) =>
  `M${x} 200 V${200 - h * 0.28} L${x + w / 2} ${200 - h} L${x + w} ${200 - h * 0.28} V200 Z`;

// A pagoda tier: a wide curved roof over a narrower body.
const tier = (cx: number, y: number, w: number) =>
  `M${cx - w / 2} ${y} Q${cx - w / 4} ${y - 4} ${cx - w / 3} ${y - 9} H${cx + w / 3} Q${cx + w / 4} ${y - 4} ${cx + w / 2} ${y} Z M${cx - w / 4} ${y} H${cx + w / 4} V${y + 14} H${cx - w / 4} Z`;

const SHAPES: Record<LandmarkId, React.ReactNode> = {
  bali: (
    <>
      <path d={GATE_HALF} />
      <path d={GATE_HALF} transform="translate(400 0) scale(-1 1)" />
      <path d="M178 200 V194 H222 V200 Z M184 194 V189 H216 V194 Z" />
      <path d="M0 200 V186 Q20 174 42 182 Q60 172 80 184 Q92 180 104 186 V200 Z M296 186 Q312 176 330 184 Q352 172 372 182 Q388 176 400 182 V200 H296 Z" />
      <path d={PALM_L} />
      <path d={PALM_L} transform="translate(410 14) scale(-1 0.93)" />
    </>
  ),
  paris: (
    <>
      <path d="M156 200 L184 128 H190 L196 66 H198 L199 26 L200 10 L201 26 L202 66 H204 L210 128 H216 L244 200 H226 Q200 160 174 200 Z" />
      <rect x="178" y="124" width="44" height="6" />
      <rect x="192" y="62" width="16" height="5" />
      <path d="M0 200 V184 H40 V176 H70 V186 H120 V180 H150 V200 Z M250 200 V182 H290 V172 H320 V184 H360 V178 H400 V200 Z" />
    </>
  ),
  london: (
    <>
      {/* Elizabeth Tower (Big Ben) and the Houses of Parliament */}
      <path d="M186 200 V70 H184 V62 H216 V70 H214 V200 Z" />
      <path d="M188 62 V44 H212 V62 Z M190 44 L200 10 L210 44 Z" />
      <circle cx="200" cy="78" r="8" fill="currentColor" opacity="0.18" />
      <path d="M60 200 V158 H72 V146 L76 140 L80 146 V158 H120 V150 H132 V140 L136 134 L140 140 V150 H186 V200 Z M214 200 V150 H262 V140 L266 134 L270 140 V150 H300 V156 H312 V144 L316 138 L320 144 V158 H350 V200 Z" />
      <path d="M0 200 V190 H60 V200 Z M350 200 V188 H400 V200 Z" />
    </>
  ),
  newyork: (
    <>
      {/* Empire State Building among Midtown blocks */}
      <path d="M168 200 V128 H176 V104 H184 V72 H190 V52 H194 V36 H198 V8 H202 V36 H206 V52 H210 V72 H216 V104 H224 V128 H232 V200 Z" />
      <path d="M0 200 V150 H26 V128 H52 V160 H78 V138 H104 V170 H130 V146 H156 V200 Z M244 200 V140 H268 V118 H292 V156 H316 V132 H340 V162 H362 V144 H386 V176 H400 V200 Z" />
    </>
  ),
  sydney: (
    <>
      {/* Opera House sails on their podium, Harbour Bridge behind */}
      <path d="M260 200 V182 Q320 120 400 150 V158 Q330 134 278 182 V200 Z" opacity="0.6" />
      <path d="M70 200 V180 H320 V200 Z" />
      <path d="M96 180 Q110 132 150 112 Q138 146 146 180 Z" />
      <path d="M140 180 Q156 120 204 98 Q188 140 196 180 Z" />
      <path d="M192 180 Q206 136 244 124 Q232 154 238 180 Z" />
      <path d="M236 180 Q246 152 276 146 Q266 164 270 180 Z" />
    </>
  ),
  rome: (
    <>
      {/* Colosseum: four tiers of arches, the outer ring broken on the right */}
      <path
        fillRule="evenodd"
        d="M70 200 V96 Q200 84 300 96 L330 118 V200 Z M84 192 V170 Q84 160 92 160 Q100 160 100 170 V192 Z M112 192 V170 Q112 160 120 160 Q128 160 128 170 V192 Z M140 192 V170 Q140 160 148 160 Q156 160 156 170 V192 Z M168 192 V170 Q168 160 176 160 Q184 160 184 170 V192 Z M196 192 V170 Q196 160 204 160 Q212 160 212 170 V192 Z M224 192 V170 Q224 160 232 160 Q240 160 240 170 V192 Z M252 192 V170 Q252 160 260 160 Q268 160 268 170 V192 Z M280 192 V170 Q280 160 288 160 Q296 160 296 170 V192 Z M84 148 V130 Q84 122 92 122 Q100 122 100 130 V148 Z M112 148 V130 Q112 122 120 122 Q128 122 128 130 V148 Z M140 148 V130 Q140 122 148 122 Q156 122 156 130 V148 Z M168 148 V130 Q168 122 176 122 Q184 122 184 130 V148 Z M196 148 V130 Q196 122 204 122 Q212 122 212 130 V148 Z M224 148 V130 Q224 122 232 122 Q240 122 240 130 V148 Z M252 148 V130 Q252 122 260 122 Q268 122 268 130 V148 Z"
      />
      <path d="M0 200 V192 H70 V200 Z M330 200 V190 H400 V200 Z" />
    </>
  ),
  agra: (
    <>
      {/* Taj Mahal: plinth, central dome, side domes and four minarets */}
      <path d="M80 200 V184 H320 V200 Z" />
      <path d="M136 184 V122 H264 V184 Z" />
      <path d="M164 122 Q158 84 200 62 Q242 84 236 122 Z" />
      <path d="M199 62 V40 H201 V62 Z" />
      <path d="M140 122 Q140 106 152 102 Q164 106 164 122 Z M236 122 Q236 106 248 102 Q260 106 260 122 Z" />
      <path d="M96 184 V96 H104 V184 Z M92 96 Q100 84 108 96 Z M296 184 V96 H304 V184 Z M292 96 Q300 84 308 96 Z" />
    </>
  ),
  tokyo: (
    <>
      {/* Mt Fuji behind a five-storey pagoda */}
      <path d="M40 200 L170 96 Q200 80 230 96 L360 200 Z" opacity="0.7" />
      <path d="M170 96 Q200 80 230 96 L214 108 L204 102 L196 110 L186 102 Z" fill="currentColor" opacity="0.28" />
      <g transform="translate(-50 0)">
        <path d={tier(150, 186, 64)} />
        <path d={tier(150, 162, 56)} />
        <path d={tier(150, 138, 48)} />
        <path d={tier(150, 114, 40)} />
        <path d={tier(150, 90, 32)} />
        <path d="M148 81 V54 H152 V81 Z" />
        <path d="M134 200 V188 H166 V200 Z" />
      </g>
    </>
  ),
  rio: (
    <>
      {/* Christ the Redeemer on Corcovado, Sugarloaf to the right */}
      <path d="M0 200 Q100 186 150 140 Q180 106 200 98 Q222 106 246 140 Q280 180 330 192 L400 196 V200 Z" />
      <path d="M197 98 V56 H203 V98 Z M176 60 H224 V65 H176 Z" />
      <circle cx="200" cy="51" r="5" />
      <path d="M300 200 Q318 140 346 136 Q372 140 384 200 Z" />
    </>
  ),
  cairo: (
    <>
      {/* The pyramids of Giza */}
      <path d="M20 200 L140 84 L260 200 Z" />
      <path d="M190 200 L282 108 L374 200 Z" opacity="0.85" />
      <path d="M318 200 L356 162 L394 200 Z" />
      <path d="M0 200 V196 H400 V200 Z" />
    </>
  ),
  arvidsjaur: (
    <>
      {/* Lappstaden, the Forest Sami church town: kåtor with pyramid roofs, a storehouse on stilts, pines */}
      <g opacity="0.6">
        <path d={spruce(40, 96, 104)} />
        <path d={spruce(76, 118, 82)} />
        <path d={spruce(330, 100, 100)} />
        <path d={spruce(368, 122, 78)} />
      </g>
      <path d={kata(104, 34, 50)} />
      <path d={kata(144, 40, 60)} />
      <path d={kata(190, 46, 70)} />
      <path d={kata(242, 36, 54)} />
      {/* njalla: a storehouse raised on poles */}
      <path d="M286 160 L304 144 L322 160 V176 H286 Z M290 176 H294 V200 H290 Z M314 176 H318 V200 H314 Z" />
      <path d="M0 200 V196 H400 V200 Z" />
    </>
  ),
  coast: (
    <>
      {/* A beach: palms leaning over the sand, a boat on the water */}
      <path d="M0 200 V184 Q60 172 130 182 Q170 188 190 200 Z" />
      <path d={PALM_L} transform="translate(-6 8)" />
      <path d={PALM_L} transform="translate(126 -6) scale(-0.9 1) translate(-110 0)" />
      <path d="M300 192 H346 L338 200 H308 Z M322 190 V150 L344 188 Z" />
      <path d="M210 194 H250 M268 198 H290 M360 196 H392" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
    </>
  ),
  mountains: (
    <>
      {/* Peaks with snow on the tops */}
      <path d="M0 200 L70 130 L104 154 L170 76 L236 150 L268 122 L340 182 L370 160 L400 180 V200 Z" />
      <path d="M170 76 L190 100 L178 96 L168 106 L158 96 L150 100 Z M70 130 L80 140 L70 138 L62 142 Z M268 122 L280 134 L268 130 L258 136 Z" fill="currentColor" opacity="0.28" />
    </>
  ),
  city: (
    <>
      {/* A skyline of mixed heights */}
      <path d="M0 200 V160 H24 V140 H48 V170 H66 V120 H92 V150 H110 V96 H124 V84 H128 V96 H142 V156 H160 V130 H186 V100 H210 V146 H230 V116 H254 V160 H272 V88 H284 V70 H288 V88 H300 V150 H322 V126 H346 V164 H370 V138 H400 V200 Z" />
    </>
  ),
  none: (
    <>
      <path d="M0 200 V170 Q60 148 130 166 T260 160 T400 168 V200 Z" opacity="0.55" />
      <path d="M0 200 V182 Q90 164 190 180 T400 178 V200 Z" />
    </>
  ),
};

export function Landmark({ id, fill, className, style }: { id: LandmarkId; fill: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax meet" className={className} style={{ color: "#fff", ...style }} fill={fill} aria-hidden="true">
      {SHAPES[id]}
    </svg>
  );
}
