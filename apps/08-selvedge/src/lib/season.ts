// Boards are named by season ("Summer 2026"). Northern seasons by month: spring Mar–May, summer
// Jun–Aug, autumn Sep–Nov, winter Dec–Feb. Winter takes the year it starts in, so January and
// February 2027 belong to "Winter 2026", the same board as December 2026. Local time, because
// it's the owner's calendar that counts.

export function seasonOf(date: Date): string {
  const m = date.getMonth(), y = date.getFullYear();
  if (m >= 2 && m <= 4) return `Spring ${y}`;
  if (m >= 5 && m <= 7) return `Summer ${y}`;
  if (m >= 8 && m <= 10) return `Autumn ${y}`;
  return `Winter ${m === 11 ? y : y - 1}`;
}

/** A name for a new board: this season, or "Summer 2026 (2)" if that's taken. */
export function newBoardName(date: Date, taken: string[]): string {
  const base = seasonOf(date);
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}
