// "Edited 5 min ago" for the My tracks list, in the viewer's local time.
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function ago(iso: string, now = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const seconds = (now.getTime() - then.getTime()) / 1000;
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min ago`;
  if (sameDay(then, now)) return `${Math.floor(seconds / 3600)} h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(then, yesterday)) return "yesterday";
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(then.getFullYear() !== now.getFullYear() && { year: "numeric" }) });
}
