// Demo data for Sam, shared by the three home-screen prototypes. "Today" is fixed so the
// prototypes always tell the same story: Monday 12 Oct, 19:40, nine days before the appointment.

export const doctor = "Dr Patel";
export const lastAppointment = "21 Sep";
export const nextAppointment = "Wed 21 Oct";
export const daysToGo = 9;
export const daysSinceLast = 21; // 21 Sep → 11 Oct, today not counted yet
export const cycleDays = 30; // 21 Sep → 21 Oct
export const missedDays = new Set([4, 11, 12]); // day indexes since the last appointment
export const loggedDays = daysSinceLast - missedDays.size; // 18

export const product = { name: "Balanced oil", detail: "THC 20 : CBD 20", usual: "0.5 ml" };

// The dose Sam hasn't said anything about yet: asked on the next open.
export const pendingDose = { when: "Last night", time: "21:30", amount: "0.5 ml" };

export type Grade = 0 | 1 | 2 | 3;

// Plain-word grades (Vinehealth's pattern): a word and what it means in daily life.
export const symptoms: {
  id: string;
  name: string;
  question: string;
  grades: [string, string][];
}[] = [
  {
    id: "pain",
    name: "Pain",
    question: "How was your pain today?",
    grades: [
      ["None", "No pain today"],
      ["Mild", "There, but not in the way"],
      ["Moderate", "Got in the way of some things"],
      ["Severe", "Stopped me doing basic things"],
    ],
  },
  {
    id: "fatigue",
    name: "Tiredness",
    question: "How tired were you today?",
    grades: [
      ["Normal", "My usual energy"],
      ["Mild", "More tired than usual, rest helps"],
      ["Moderate", "Rest didn't help, some things were hard"],
      ["Severe", "Hard to get washed or dressed"],
    ],
  },
  {
    id: "mood",
    name: "Mood",
    question: "How was your mood?",
    grades: [
      ["Good", "Felt like myself"],
      ["A bit low", "Low, but managing"],
      ["Low", "Hard to enjoy things"],
      ["Very low", "Struggled to get through the day"],
    ],
  },
  {
    id: "sleep",
    name: "Sleep",
    question: "How did you sleep last night?",
    grades: [
      ["Well", "Woke up rested"],
      ["A bit broken", "Woke once or twice"],
      ["Poorly", "Woke a lot, tired today"],
      ["Barely", "Hardly slept"],
    ],
  },
];

export const reliefOptions = ["No help", "A little", "Quite a bit", "A lot"];
export const sideEffects = ["Dry mouth", "Drowsy", "Dizzy", "Foggy", "Anxious", "Hungry"];

// Today so far: one dose at lunch, already rated.
export const todayDoses = [{ time: "12:30", amount: "0.5 ml", relief: "A little" }];

export const earlierDays = [
  { day: "Sun 11 Oct", parts: ["Pain moderate", "Slept a bit broken", "2 doses, helped quite a bit"] },
  { day: "Sat 10 Oct", parts: ["Pain mild", "Slept well", "2 doses, helped a lot"] },
  { day: "Fri 9 Oct", parts: ["Pain moderate", "Slept poorly", "Dry mouth", "3 doses, helped a little"] },
];

// What the summary will say (numbers worked out from the demo history).
export const summary = {
  range: "21 Sep – 12 Oct",
  rows: [
    { name: "Pain", now: "Mild to moderate", before: "Moderate", trend: "A little better" },
    { name: "Sleep", now: "A bit broken", before: "Poorly", trend: "Better" },
    { name: "Tiredness", now: "Moderate", before: "Moderate", trend: "About the same" },
    { name: "Mood", now: "A bit low", before: "A bit low", trend: "About the same" },
  ],
  doses: "38 doses · 0.5 ml Balanced oil",
  relief: "Helped quite a bit or a lot: 22 of 31 rated",
  side: "Dry mouth on 12 days · Drowsy on 5",
};
