import type { Status } from "@/lib/products";
import { cn } from "@/lib/utils";

const styles: Record<Status, string> = {
  shipped: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  building: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  parked: "bg-muted text-muted-foreground",
  idea: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles[status] ?? styles.idea)}>
      {status}
    </span>
  );
}
