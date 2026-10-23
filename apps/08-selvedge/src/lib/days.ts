// The inbox's day markers (owner's pick, 23 Oct): saves grouped by the local day they were saved,
// newest day first, each headed "Today", "Yesterday" or "Wednesday 22 Oct" (plus the year when
// it isn't this year).

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function dayLabel(day: Date, now = new Date()): string {
  if (dayKey(day) === dayKey(now)) return "Today";
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey(day) === dayKey(yesterday)) return "Yesterday";
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" });
  const date = day.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(day.getFullYear() !== now.getFullYear() && { year: "numeric" }) });
  return `${weekday} ${date}`;
}

/** Group items by the local day of `createdAt`, newest day first, keeping each day's order. */
export function byDay<T extends { createdAt: string }>(items: T[], now = new Date()): { label: string; items: T[] }[] {
  const groups = new Map<string, { at: number; label: string; items: T[] }>();
  for (const item of items) {
    const d = new Date(item.createdAt), key = dayKey(d);
    const g = groups.get(key) ?? { at: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), label: dayLabel(d, now), items: [] };
    g.items.push(item);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.at - a.at).map(({ label, items }) => ({ label, items }));
}
