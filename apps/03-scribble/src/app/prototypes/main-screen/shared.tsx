"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const PROMPTS = [
  "Describe a sound you heard today, as if it had opinions.",
  "Write about the last time a stranger made you smile.",
  "Something you own that has outlived its purpose. Why do you keep it?",
  "Your commute, told as a nature documentary.",
  "A smell that takes you somewhere. Take us there.",
  "The most overconfident object in your kitchen.",
];

export const GOAL = 4;

export type Feedback = { strength: string; tryNext: string };
export type Stage = "writing" | "set" | "reading" | "read";

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function clip(s: string, words = 12) {
  const w = s.replace(/[.!?]+$/, "").split(/\s+/);
  return w.length > words ? w.slice(0, words).join(" ") + "…" : w.join(" ");
}

// Stand-in for the Claude call: quotes the writer's own words, one strength and one thing to try.
export function sampleFeedback(text: string): Feedback {
  const s = sentences(text);
  const first = clip(s[0] ?? text);
  const last = clip(s[s.length - 1] ?? text);
  if (s.length < 2) {
    return {
      strength: `“${first}” has a voice already: it sounds like you talking, not like someone trying to write.`,
      tryNext: `Add one concrete detail the reader could see or hear. What exactly was in front of you?`,
    };
  }
  return {
    strength: `“${first}” is a confident opening. It drops me straight into the moment without warming up first.`,
    tryNext: `Your ending, “${last}”, explains the feeling. Try ending on an image instead and let the reader feel it.`,
  };
}

export function useScribble() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("writing");
  const [done, setDone] = useState(2);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [nudge, setNudge] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const anotherSpark = useCallback(() => setPromptIndex((i) => (i + 1) % PROMPTS.length), []);

  const setDown = useCallback(() => {
    if (!text.trim()) {
      setNudge(true);
      return;
    }
    setNudge(false);
    setStage("set");
    setDone((d) => Math.min(d + 1, GOAL));
  }, [text]);

  const askReader = useCallback(() => {
    setStage("reading");
    timer.current = setTimeout(() => {
      setFeedback(sampleFeedback(text));
      setStage("read");
    }, 1600);
  }, [text]);

  const startOver = useCallback(() => {
    setText("");
    setFeedback(null);
    setStage("writing");
    setPromptIndex((i) => (i + 1) % PROMPTS.length);
  }, []);

  return {
    prompt: PROMPTS[promptIndex],
    text,
    setText: (t: string) => {
      setText(t);
      if (t.trim()) setNudge(false);
    },
    stage,
    done,
    feedback,
    nudge,
    anotherSpark,
    setDown,
    askReader,
    startOver,
  };
}

export function Dots({ done, label = true }: { done: number; label?: boolean }) {
  return (
    <div className="dots" aria-label={`${done} of ${GOAL} pieces this week`} role="img">
      {Array.from({ length: GOAL }, (_, i) => (
        <span key={i} className="dot" data-filled={i < done ? "" : undefined} />
      ))}
      {label && <span className="dots-label" aria-hidden="true">this week</span>}
    </div>
  );
}

export function wordCount(text: string) {
  const w = text.trim().split(/\s+/).filter(Boolean);
  return w.length;
}

/** Grows a textarea with its content. */
export function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}
