import type { Form } from "./data";

// Know your medicine: general, factual information about each form, never advice. Guardrails:
// no products, strengths or doses (a card's dose comes only from My plan, as "Your plan"); no
// "start", "stop" or "change"; no claims ("best", "proven", "effective", "works"); effects are
// said to vary. Every string here was checked against them (see the product journal).

export type FormCard = {
  form: Exclude<Form, "Other">;
  title: string;
  what: string;
  how: string;
  timing: string;
  side: string[];
  storage: string;
  questions: string[];
};

const VARIES = "This varies from person to person.";

// Shared across forms: what THC and CBD can cause, and the rules for driving and travel.
export const thcCbd = [
  "THC can cause dizziness, a dry mouth, drowsiness, a fast heartbeat, and anxiety at higher amounts.",
  "CBD can cause drowsiness and an upset stomach, and can interact with some other medicines.",
];
export const driving = [
  "In the UK, you can drive on prescribed cannabis if you take it as prescribed and are not impaired. If you feel drowsy, dizzy or slowed down, don't drive.",
  "Carry your prescription or a letter from your clinic. Rules are different in other countries, so check before you travel.",
];
export const intro = "General information about this form. Effects vary from person to person; your doctor or pharmacist can tell you what applies to you.";

export const formCards: FormCard[] = [
  {
    form: "Oil",
    title: "Oil",
    what: "Cannabis extract in a carrier oil, in a bottle with a dropper or an oral syringe. The label shows how much THC and CBD it contains.",
    how: "Measured with the dropper or syringe and held under the tongue for a short while before swallowing, as your doctor or pharmacist explained.",
    timing: `Usually starts in 30 to 90 minutes, sometimes longer, and lasts several hours. ${VARIES}`,
    side: ["Effects come on slowly, so they can build up later than you expect."],
    storage: "Upright and closed, away from heat and light, out of reach of children.",
    questions: [
      "How long should we give it before we look at whether things have changed?",
      "What should I do if I miss a dose?",
      "Could it interact with my other medicines?",
      "Which side effects should I tell you about?",
    ],
  },
  {
    form: "Flower",
    title: "Flower",
    what: "Dried cannabis flower, heated in a medical vaporiser so you breathe in the vapour. It isn't meant to be smoked.",
    how: "Ground and put in your vaporiser, then heated as your clinic or the vaporiser's instructions explain. The label shows the amount in grams.",
    timing: `Usually starts within minutes and lasts a few hours. ${VARIES}`,
    side: ["Breathing in vapour can leave your throat dry or sore."],
    storage: "In its sealed container, somewhere cool, dark and dry, out of reach of children. Clean the vaporiser as its instructions say.",
    questions: [
      "Would a different form suit my flare-ups better?",
      "How should flower fit alongside my other medicine?",
      "Which vaporiser settings should I use?",
      "What should I do if it makes me anxious or dizzy?",
    ],
  },
  {
    form: "Vape",
    title: "Vape",
    what: "A pre-filled cartridge of cannabis extract, used in a vape pen. Amounts are counted in puffs.",
    how: "Breathed in from the pen as your clinic showed you. Your label says how many puffs; some pens count them for you.",
    timing: `Usually starts within minutes and lasts a few hours. ${VARIES}`,
    side: ["Breathing in vapour can leave your throat dry or sore."],
    storage: "Upright and capped, away from heat, out of reach of children. Use only the battery made for your cartridge.",
    questions: [
      "What's the most I should use in a day?",
      "How should it fit alongside my other medicine?",
      "What should I do if a puff doesn't seem to do anything?",
      "Would a different form suit me better?",
    ],
  },
  {
    form: "Capsule",
    title: "Capsule",
    what: "Cannabis extract in a capsule, so each one holds a fixed amount.",
    how: "Swallowed, as your label says.",
    timing: `Slow to start, often 1 to 2 hours or more, and lasts several hours. ${VARIES}`,
    side: ["Effects come on slowly, so they can build up later than you expect."],
    storage: "In the original pack, somewhere cool and dry, out of reach of children.",
    questions: [
      "Should I take it with food?",
      "How long should we give it before we look at whether things have changed?",
      "What should I do if I miss a capsule?",
      "Could it interact with my other medicines?",
    ],
  },
];

export const cardFor = (form: Form) => formCards.find((c) => c.form === form);
