import type { ParsedSession } from "@/lib/types";

// Lets visitors without the access code see the full flow at zero cost:
// a sample note plus the structure Claude would return for it.
export const DEMO_NOTE =
  "Olympic lifting day. Snatch, worked up to 62 kilos, missed 65 twice. Then clean and jerk, " +
  "5 sets of 2 at 80. Finished with back squat, 3 by 5 at 110, felt strong.";

export const DEMO_RESULT: ParsedSession = {
  date: null,
  title: "Olympic lifting day",
  lifts: [
    { movement: "Snatch", sets: null, reps: 1, weight: 62, unit: "kg", note: "Missed 65 twice" },
    { movement: "Clean and Jerk", sets: 5, reps: 2, weight: 80, unit: "kg", note: null },
    { movement: "Back Squat", sets: 3, reps: 5, weight: 110, unit: "kg", note: "Felt strong" },
  ],
};
