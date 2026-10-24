// Every user-facing string in Wont, in one place, so the owner's copy rewrite is one edit.
// Draft copy from the approved prototypes (T4, T12, T13); the owner rewrites at the final review.
// Strings that need data are small functions.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * User wording placed inside a template, exactly as typed (never re-cased, feedback 28), wrapped
 * in Unicode isolates (FSI … PDI, the plain-text twin of <bdi>) so a right-to-left phrase can't
 * scramble the template words around it (feedback 32).
 */
const u = (s: string) => `\u2068${s}\u2069`;
const nf = new Intl.NumberFormat();
/** Counts in the reader's number format (feedback 32). */
export const num = (n: number) => nf.format(n);

export const copy = {
  app: {
    name: "Wont",
    titles: { intro: "Intro", newBuild: "A new promise", newStop: "Something to stop", habit: "Habit" },
    description: "A drawing board of promises to yourself. Missing a day doesn't reset you.",
  },

  days: {
    weekday: (n: number) => WEEKDAYS[n],
    letter: (n: number) => WEEKDAYS[n][0],
    /** "Sat 24 Oct" */
    short: (weekday: number, date: number, month: number) =>
      `${WEEKDAYS[weekday].slice(0, 3)} ${date} ${MONTHS[month]}`,
  },

  board: {
    weekLabel: "This week",
    dayKept: (day: string, kept: number, total: number) => `${day}: ${num(kept)} of ${num(total)} kept`,
    add: "Add a habit",
    replayIntro: "Watch the intro again",
    emptyTitle: "Your board is empty",
    emptyBody: "Start with one promise to yourself.",
    emptyPrimary: "Make my first promise",
    emptyStop: "Or something to stop",
    addSheetTitle: "Add to your board",
    addBuild: "A new promise",
    addBuildHint: "Something to do every day",
    addStop: "Something to stop",
    addStopHint: "A habit to leave behind",
    notNow: "Not now",
    open: (name: string) => `Open ${u(name)}`,
  },

  card: {
    /** "4 of last 7". A rate of 0 while today is still open reads as the way back, not the gap. */
    rate: (kept: number, of: number, todayOpen = false) =>
      of === 0 ? "New, no days yet" : kept === 0 && todayOpen ? "Back today" : `${num(kept)} of last ${num(of)}`,
    cleanDays: (n: number) => (n === 0 ? "No clean days yet" : n === 1 ? "1 clean day" : `${num(n)} clean days`),
    buildLine: (anchor: string, action: string, goal: string) =>
      `After ${u(anchor)}, I will ${u(action)} · ${u(goal)}`,
    stopLine: (trigger: string, replacement: string) =>
      `Usually ${u(trigger)}. Instead: ${u(replacement)}`,
    /** Under a stop habit's steamer, so its pile (last 7 days) isn't read as the clean-day total. */
    pileCaption: "this week",
    open: "Tap when kept",
    kept: "Kept",
    comeback: "Comeback",
    cleanSoFar: "Clean so far",
    tapIfClean: "Tap if clean so far",
    slipped: (size: string, clean: number) =>
      clean === 0
        ? `Slip of ${size} today`
        : `Slip of ${size} today · ${clean === 1 ? "1 clean day still counts" : `${num(clean)} clean days still count`}`,
    slipNext: (replacement: string) => `Next time: ${u(replacement)} first.`,
    /** "ridden out" only once the 60 s pause has run to the end (feedback 34). */
    urges: (n: number, riddenOut = false) =>
      ` · ${n === 1 ? "1 urge" : `${num(n)} urges`}${riddenOut ? (n === 1 ? " ridden out" : ", the last ridden out") : ""}`,
    slipButton: "Slipped",
    urgeButton: "Had an urge",
    ariaBuild: (name: string, kept: boolean) =>
      `${u(name)}: ${kept ? "kept today, tap to undo" : "tap when kept"}`,
    ariaStop: (name: string, clean: boolean) =>
      `${u(name)}: ${clean ? "clean so far, tap to undo" : "tap if clean so far"}`,
    ariaSlipped: (name: string) => `${u(name)}: slipped today, tap to change`,
  },

  // R7: one short, quiet line (feedback 24, 27). Names the most recent missed day as what it was.
  // Never failure words, never a count of zero.
  comeback: {
    build: (lastMissedWeekday: number, runLength: number) =>
      `${runLength > 1 ? "The last few days stayed empty" : `${WEEKDAYS[lastMissedWeekday]} stayed empty`}. Today counts.`,
    stopSlip: (lastMissedWeekday: number, clean: number) =>
      `${WEEKDAYS[lastMissedWeekday]} had a slip. ${
        clean === 0 ? "Today counts." : clean === 1 ? "Your clean day still counts." : `Your ${num(clean)} clean days still count.`
      }`,
    stopUnlogged: (lastMissedWeekday: number, runLength: number) =>
      `${runLength > 1 ? "The last few days went unlogged" : `${WEEKDAYS[lastMissedWeekday]} went unlogged`}. Today counts.`,
  },

  slip: {
    title: "How many today?",
    titleDay: (weekday: number) => `How many on ${WEEKDAYS[weekday]}?`,
    body: "It happens. Logging it honestly is the habit.",
    undo: "No slip after all",
    notNow: "Not now",
    sizeLabel: (s: string) => `Slip of ${s}`,
  },

  ride: {
    label: "Ride out the urge",
    seconds: (n: number) => `${n} s`,
    title: "Let this one pass",
    body: (replacement: string) =>
      `Urges rise and fall, usually within a few minutes. Your plan: ${u(replacement)}. Breathe out slowly.`,
    exit: "I'm OK now",
  },

  form: {
    back: "← Board",
    buildTitle: "A new promise",
    buildIntro: "Tie it to something you already do every day.",
    after: "After…",
    afterPlaceholder: "my morning coffee",
    afterHint: "Something you already do every day, at about the right time.",
    will: "I will…",
    willPlaceholder: "write in my journal",
    goal: "Done when",
    goalPlaceholder: "One sentence",
    goalHint: "Small and clear, so each day it's plainly kept or not. You can grow it later.",
    goalChips: ["10 pages", "Up by 7:00", "One sentence", "20 minutes"],
    why: "Why this matters to me",
    whyPlaceholder: "In your own words",
    optional: " · optional",
    stopTitle: "Something to stop",
    stopIntro: "Plan for the moment it usually happens.",
    stopName: "What do you want to stop?",
    stopNamePlaceholder: "Nicotine pouches",
    trigger: "When does it usually happen?",
    triggerPlaceholder: "After meals, with coffee",
    triggerHint: "The moment and the place. That's where the plan goes.",
    friction: "One thing that makes it harder",
    frictionPlaceholder: "Keep it out of reach",
    frictionHint: "Do it once, today. A little effort in the way goes a long way.",
    instead: "Instead, I will…",
    insteadPlaceholder: "Chew gum",
    insteadHint: "Something to do in that moment, not just something to avoid.",
    name: "Card title",
    preview: "Preview",
    previewBuildName: "I will…",
    previewStopName: "What to stop",
    previewAfter: (after: string, action: string) => (action ? `After ${u(after)}, I will ${u(action)}` : `After ${u(after)}`),
    previewGoal: (goal: string) => `Done when: ${u(goal)}`,
    previewStopLine: "Usually … Instead: …",
    save: "Add to my board",
    saveEdit: "Save changes",
  },

  detail: {
    notFound: "This habit isn't on your board any more.",
    today: "Today",
    yesterday: "Yesterday",
    logTitle: "Change a log",
    logHint: "Today and yesterday can be changed.",
    keptToggle: "Kept",
    cleanToggle: "Clean",
    noSlip: "No slip",
    urgeCount: (n: number) => (n === 0 ? "No urges" : n === 1 ? "1 urge" : `${num(n)} urges`),
    removeUrge: "Remove one",
    historyTitle: "History",
    historyHint: "The last two weeks. Nothing here is ever wiped.",
    status: {
      kept: "Kept",
      comeback: "Comeback",
      /** A stop habit's finished clean day (feedback 34: "Clean", not "Kept"). */
      clean: "Clean",
      cleanSoFar: "Clean so far",
      slip: (size: string) => `Slip of ${size}`,
      notLogged: "Not logged",
      pending: "Not logged yet",
      urges: (n: number) => ` · ${n === 1 ? "1 urge" : `${num(n)} urges`}`,
    },
    editTitle: "Wording",
    editHint: "Your history stays as it is.",
    saved: "Saved",
    deleteButton: "Delete this habit",
    deleteConfirm: (name: string) => `Delete “${u(name)}” and all its history? This can't be undone.`,
    deleteYes: "Delete it",
    deleteNo: "Keep it",
  },

  intro: {
    skip: "Skip",
    s1Title: "About two months, not 21 days.",
    s1Body:
      "Most habits take around two months to feel automatic, sometimes longer. That's normal.",
    s1Axis: "weeks",
    s2Title: "Tie it to something you already do.",
    s2Body: "Pick a moment that already happens every day. The new habit rides along with it.",
    s2Anchor: "After my morning coffee",
    s2Action: "I write one sentence",
    s3Title: "Missing a day doesn't reset you.",
    s3Body: "Coming back counts. The day you return gets its own wonton, with a wink.",
    endTitle: "Ready when you are.",
    endBody: "Start with one promise to yourself.",
    endFirst: "Make my first promise",
    endBoard: "Back to my board",
    again: "Watch again",
  },
};
