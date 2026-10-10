"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The typewriter feeling without a typewriter: struck, slightly uneven letters and soft key clicks.

/** Deterministic 0..1 per character, so each letter lands a little differently (and the same on server and client). */
function jitter(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Split into what a reader sees as one character, so emoji with skin tones (👵🏼), hearts (❤️) and
// letters with combining accents stay whole (break-ui, 10 Oct).
const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
function graphemes(text: string) {
  return segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);
}

export function Struck({ text, from = 0, red = false }: { text: string; from?: number; red?: boolean }) {
  return (
    <>
      {text.split("\n").map((line, li, lines) => (
        <span key={li}>
          {graphemes(line).map((ch, ci) => {
            const i = from + li * 97 + ci;
            return /^\s$/.test(ch) ? (
              " "
            ) : (
              <span
                key={ci}
                className={red ? "strike red" : "strike"}
                style={{ "--y": `${((jitter(i) - 0.5) * 1.4).toFixed(2)}px`, "--o": (0.76 + jitter(i + 7) * 0.24).toFixed(2) } as React.CSSProperties}
              >
                {ch}
              </span>
            );
          })}
          {li < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

/** A soft key click, synthesised with Web Audio (no files). Starts on the first key press. */
export function useKeyClick(enabled: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    const c = (ctx.current ??= new AudioContext());
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
    gain.gain.setValueAtTime(0.45, t);
    src.connect(band).connect(gain).connect(c.destination);
    src.start(t);
  }, [enabled]);
}

/** Reveals `text` one character at a time once `active`, calling onChar per letter. */
export function useTypedOut(text: string, active: boolean, onChar?: () => void, msPerChar = 26) {
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
  return active ? text.slice(0, n) : "";
}

/** On a typewriter you add or strike the last letter: keep the caret at the end. */
export function keepCaretAtEnd(e: React.SyntheticEvent<HTMLTextAreaElement>) {
  const el = e.currentTarget;
  const end = el.value.length;
  if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end);
}
