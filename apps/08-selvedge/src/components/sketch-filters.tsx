// The sketchbook's SVG filters: a little noise bends every border drawn with them, so lines
// wobble like a pencil and washes bleed like watercolour. Rendered once per page.
export function SketchFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <filter id="pencil-line"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="3.2" /></filter>
      <filter id="wash-edge"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="9" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter>
      <filter id="ink-bleed"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" /><feDisplacementMap in="SourceGraphic" scale="3" /></filter>
    </svg>
  );
}
