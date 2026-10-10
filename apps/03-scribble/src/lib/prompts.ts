// Hand-written prompts: small, concrete, a mix of observation, memory and humour (brief: rabbit
// holes). Each should be answerable in a few sentences.
export const PROMPTS = [
  "Describe a sound you heard today, as if it had opinions.",
  "Write about the last time a stranger made you smile.",
  "Something you own that has outlived its purpose. Why do you keep it?",
  "Your commute, told as a nature documentary.",
  "A smell that takes you somewhere. Take us there.",
  "The most overconfident object in your kitchen.",
  "What did the weather do today? Give it a personality.",
  "A small lie you told recently, and why it felt necessary.",
  "Describe your hands, as if introducing them to someone.",
  "The last thing that made you laugh out loud. Make us laugh too.",
  "A door you walk through every day. What's on the other side, really?",
  "Write the first paragraph of a review of your morning.",
  "Someone you saw today but will never see again.",
  "Something you were sure about as a child that turned out wrong.",
  "Your phone's lock screen, described to someone from 1950.",
  "A meal you remember better than the people you ate it with.",
  "The quietest moment of your day.",
  "An argument between two things in your bag.",
  "What does your street sound like at night?",
  "A word you love the sound of. Use it three times.",
  "The best advice you ignored.",
  "Describe a colour without naming it.",
  "A habit of yours, explained to an alien.",
  "The view from where you're sitting, in exactly five sentences.",
  "A place that used to be important to you and isn't anymore.",
  "Write a complaint letter to a minor inconvenience.",
  "What would your houseplant say about you?",
  "A conversation you overheard, and what you imagine came next.",
  "The moment just before you fall asleep.",
  "Something small you're proud of this week.",
  "A song stuck in your head. Why this one, why now?",
  "Describe a friend by the way they enter a room.",
  "The worst gift you've received, described lovingly.",
  "A rule you follow that nobody taught you.",
  "Write about waiting. For anything.",
  "Your shoes, and where they've been this week.",
  "A text message you almost sent.",
  "The first warm day of the year.",
  "Something you see every day but have never really looked at.",
  "Today, as a headline. Then the first line of the story.",
];

/** A prompt you haven't seen recently (avoids the last `recent` prompts used). */
export function pickPrompt(used: string[], current?: string, recent = 25) {
  const avoid = new Set([...used.slice(0, recent), current]);
  const fresh = PROMPTS.filter((p) => !avoid.has(p));
  const pool = fresh.length ? fresh : PROMPTS.filter((p) => p !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}
