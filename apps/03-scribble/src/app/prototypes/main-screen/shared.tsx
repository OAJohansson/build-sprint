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

/** Small deterministic jitter per character, so each letter lands a little differently. */
export function jitter(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

/** Typewriter sounds, synthesised with Web Audio (no files). Starts on the first key press. */
export function useTypeSound(enabled: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  const get = () => {
    if (!enabled || typeof window === "undefined") return null;
    ctx.current ??= new AudioContext();
    return ctx.current;
  };
  const click = useCallback(() => {
    const c = get();
    if (!c) return;
    const t = c.currentTime;
    const len = Math.floor(c.sampleRate * 0.03);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const src = c.createBufferSource();
    src.buffer = buf;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1800 + Math.random() * 1600;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.5, t);
    src.connect(band).connect(gain).connect(c.destination);
    src.start(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  const bell = useCallback(() => {
    const c = get();
    if (!c) return;
    const t = c.currentTime;
    for (const f of [2093, 3136]) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.9);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return { click, bell };
}

/** Reveals `text` one character at a time once `active`, calling onChar per character. */
export function useTypedOut(text: string, active: boolean, onChar?: () => void, msPerChar = 28) {
  const [n, setN] = useState(0);
  const onCharRef = useRef(onChar);
  useEffect(() => {
    onCharRef.current = onChar;
  });
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show it all at once
      setN(text.length);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (text[i - 1] && text[i - 1] !== " ") onCharRef.current?.();
      if (i >= text.length) clearInterval(id);
    }, msPerChar);
    return () => clearInterval(id);
  }, [text, active, msPerChar]);
  return text.slice(0, n);
}

/** Keeps the caret at the end: on a typewriter you can only add or strike the last letter. */
export function keepCaretAtEnd(e: React.SyntheticEvent<HTMLTextAreaElement>) {
  const el = e.currentTarget;
  const end = el.value.length;
  if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end);
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
