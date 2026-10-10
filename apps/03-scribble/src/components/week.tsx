"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";

export const DEFAULT_GOAL = 4;
const MIN = 1;
const MAX = 7;

/** The weekly goal is a preference, so it stays on this device (like CrossFit Log's). */
export function useWeeklyGoal() {
  return useLocalStorage("03-scribble:weekly-goal", DEFAULT_GOAL);
}

/**
 * Typed marks for the week (■ ■ □ □). Tapping them explains what they are and lets you change
 * the goal: progressive disclosure, no extra words on screen the rest of the time.
 */
export function Week({ done }: { done: number }) {
  const [goal, setGoal] = useWeeklyGoal();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const marks = Array.from({ length: goal }, (_, i) => (i < done ? "■" : "□")).join(" ") + (done > goal ? ` +${done - goal}` : "");

  return (
    <span className="sc-week-wrap" ref={root} onClick={(e) => e.stopPropagation()}>
      <button
        className="sc-week"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${done} of ${goal} pieces this week. Change goal`}
      >
        {marks}
      </button>
      {open && (
        <span className="sc-goal" role="dialog" aria-label="Weekly goal">
          <span className="sc-goal-line">
            this week: {done} of {goal}
          </span>
          <span className="sc-goal-line">
            goal
            <button className="sc-step" onClick={() => setGoal((g) => Math.max(MIN, g - 1))} disabled={goal <= MIN} aria-label="Fewer pieces">
              −
            </button>
            <span className="sc-goal-n" aria-live="polite">{goal}</span>
            <button className="sc-step" onClick={() => setGoal((g) => Math.min(MAX, g + 1))} disabled={goal >= MAX} aria-label="More pieces">
              +
            </button>
            a week
          </span>
        </span>
      )}
    </span>
  );
}
