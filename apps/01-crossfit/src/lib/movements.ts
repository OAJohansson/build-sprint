// The canonical movement list. The AI maps what you say onto these names, so
// PBs for "squat clean" and "clean" don't end up split across two entries.
//
// pb says how a PB is measured:
//   load   heaviest weight for a rep count (1RM, 3RM, 5RM…)
//   reps   most unbroken reps
//   time   fastest time (benchmark "for time" WODs, cardio tests)
//   rounds most rounds + reps (AMRAP benchmarks)
//   none   logged, but no PB (generic cardio inside a WOD)

export const CATEGORIES = ["Olympic", "Strength", "Gymnastics", "KB & DB", "Cardio", "WODs"] as const;
export type Category = (typeof CATEGORIES)[number] | "Other";
export type PbKind = "load" | "reps" | "time" | "rounds" | "none";

export type Movement = { name: string; category: Category; pb: PbKind; detail?: string };

const m = (category: Category, pb: PbKind, names: string[]): Movement[] =>
  names.map((name) => ({ name, category, pb }));

export const MOVEMENTS: Movement[] = [
  ...m("Olympic", "load", [
    "Snatch", "Power Snatch", "Hang Snatch", "Hang Power Snatch", "Muscle Snatch", "Snatch Balance",
    "Overhead Squat", "Snatch Pull", "Clean", "Power Clean", "Hang Clean", "Hang Power Clean",
    "Clean Pull", "Clean & Jerk", "Split Jerk", "Push Jerk", "Squat Jerk",
  ]),
  ...m("Strength", "load", [
    "Back Squat", "Front Squat", "Deadlift", "Sumo Deadlift", "Romanian Deadlift", "Bench Press",
    "Strict Press", "Push Press", "Thruster", "Weighted Pull-up",
  ]),
  ...m("Gymnastics", "reps", [
    "Pull-up", "Strict Pull-up", "Chest-to-Bar Pull-up", "Bar Muscle-up", "Ring Muscle-up",
    "Handstand Push-up", "Strict Handstand Push-up", "Toes-to-Bar", "Ring Dip", "Push-up",
    "Pistol", "Rope Climb", "Box Jump", "Burpee", "Air Squat",
  ]),
  { name: "Handstand Walk", category: "Gymnastics", pb: "reps", detail: "metres" },
  ...m("KB & DB", "load", ["Kettlebell Swing", "Turkish Get-up", "Dumbbell Snatch", "Dumbbell Clean & Jerk"]),
  ...m("KB & DB", "reps", ["Wall Ball"]),
  ...m("Cardio", "reps", ["Double-under"]),
  ...m("Cardio", "time", ["Row 500 m", "Row 2 km", "Run 400 m", "Run 1 mile", "Run 5 km", "Ski 500 m", "Bike 1 km"]),
  ...m("Cardio", "none", ["Row", "Run", "Bike", "Ski Erg", "Jump Rope"]),
  // Benchmark WODs: the "Girls" and well-known Hero workouts.
  { name: "Fran", category: "WODs", pb: "time", detail: "21-15-9 thrusters, pull-ups" },
  { name: "Grace", category: "WODs", pb: "time", detail: "30 clean & jerks" },
  { name: "Isabel", category: "WODs", pb: "time", detail: "30 snatches" },
  { name: "Diane", category: "WODs", pb: "time", detail: "21-15-9 deadlifts, HSPU" },
  { name: "Elizabeth", category: "WODs", pb: "time", detail: "21-15-9 cleans, ring dips" },
  { name: "Helen", category: "WODs", pb: "time", detail: "3 rds: 400 m run, 21 KB swings, 12 pull-ups" },
  { name: "Annie", category: "WODs", pb: "time", detail: "50-40-30-20-10 double-unders, sit-ups" },
  { name: "Karen", category: "WODs", pb: "time", detail: "150 wall balls" },
  { name: "Jackie", category: "WODs", pb: "time", detail: "1k row, 50 thrusters, 30 pull-ups" },
  { name: "Nancy", category: "WODs", pb: "time", detail: "5 rds: 400 m run, 15 OHS" },
  { name: "Amanda", category: "WODs", pb: "time", detail: "9-7-5 muscle-ups, squat snatches" },
  { name: "Murph", category: "WODs", pb: "time", detail: "1 mi run, 100/200/300, 1 mi run" },
  { name: "DT", category: "WODs", pb: "time", detail: "5 rds: 12 DL, 9 HPC, 6 push jerks" },
  { name: "Cindy", category: "WODs", pb: "rounds", detail: "20 min AMRAP: 5 pull-ups, 10 push-ups, 15 squats" },
  { name: "Mary", category: "WODs", pb: "rounds", detail: "20 min AMRAP: 5 HSPU, 10 pistols, 15 pull-ups" },
  { name: "Chelsea", category: "WODs", pb: "rounds", detail: "EMOM 30: 5 pull-ups, 10 push-ups, 15 squats" },
  // A class WOD that isn't a benchmark: logged with its score, no PB.
  { name: "WOD", category: "WODs", pb: "none" },
];

const byName = new Map(MOVEMENTS.map((mv) => [mv.name.toLowerCase(), mv]));

/** Look a movement up by name (case-insensitive). Unknown names become "Other" with no PB. */
export function findMovement(name: string): Movement {
  return byName.get(name.trim().toLowerCase()) ?? { name: name.trim(), category: "Other", pb: "none" };
}

export const isWod = (name: string) => findMovement(name).category === "WODs";
