/** Scroll a just-opened item into view if it has grown below the fold (F7): smooth, unless reduced motion is on. */
export function reveal(el: Element | null) {
  if (!el || !el.getClientRects().length) return; // not shown at this width
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" });
}
