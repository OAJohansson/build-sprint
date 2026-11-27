// "Next from here" (F1, user test 27 Nov): Your thread suggests where to go, not only what is done. The picks are
// schools you haven't begun that are one thread away from the ones you have, taking turns from the most recently
// touched school down, so they spread over what you've been reading. With
// nothing begun, it suggests the earliest schools on the timeline.

export type NextLink = { from: string; to: string };
export type NextPick<L extends NextLink> = {
  id: string;
  /** The begun school it is one thread from, and that thread; missing for "start at the beginning". */
  via?: string;
  link?: L;
};
export type NextFromHere<L extends NextLink> = { mode: "next" | "start"; picks: NextPick<L>[] };

/**
 * @param begun ids of schools started or with all ideas seen, most recent first
 * @param links every link, in content order (the order ties are broken in)
 * @param earliest every school id, earliest on the timeline first
 */
export function nextFromHere<L extends NextLink>(begun: string[], links: L[], earliest: string[], max = 3): NextFromHere<L> {
  const done = new Set(begun);
  const picks: NextPick<L>[] = [];
  const taken = new Set<string>();
  // Each begun school's unbegun neighbours, in link order.
  const queues = begun.map((b) =>
    links
      .filter((l) => l.from === b || l.to === b)
      .map((l) => ({ id: l.from === b ? l.to : l.from, via: b, link: l }))
      .filter((c) => !done.has(c.id)),
  );
  // Take turns, most recent school first, so the picks spread over what you've been reading rather than all
  // hanging off the latest school.
  for (let round = 0; picks.length < max && queues.some((q) => q.length > round); round++) {
    for (const q of queues) {
      const c = q[round];
      if (!c || taken.has(c.id)) continue;
      taken.add(c.id);
      picks.push(c);
      if (picks.length === max) break;
    }
  }
  if (picks.length) return { mode: "next", picks };
  // Nothing begun, or everything one thread away is begun already: the earliest schools not yet begun.
  const rest = earliest.filter((id) => !done.has(id)).slice(0, max).map((id) => ({ id }));
  return { mode: "start", picks: rest };
}
