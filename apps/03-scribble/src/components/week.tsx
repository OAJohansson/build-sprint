import { WEEKLY_GOAL } from "@/lib/week";

/** Typed marks for the week's goal: ■ ■ □ □ */
export function Week({ done }: { done: number }) {
  return (
    <span className="sc-week" role="img" aria-label={`${Math.min(done, WEEKLY_GOAL)} of ${WEEKLY_GOAL} pieces this week`}>
      {Array.from({ length: WEEKLY_GOAL }, (_, i) => (i < done ? "■" : "□")).join(" ")}
      {done > WEEKLY_GOAL && ` +${done - WEEKLY_GOAL}`}
    </span>
  );
}
