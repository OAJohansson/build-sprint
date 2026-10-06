"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typing for the Web Speech API (Chrome, Edge, Safari 14.5+).
type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<Result> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

/**
 * Join recognition results into one string, tolerating browser quirks:
 * Chrome on Android sends cumulative results ("testing", "testing again")
 * and some browsers re-deliver a phrase that was already final.
 */
export function joinResults(parts: string[]): string {
  let acc = "";
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    const a = acc.toLowerCase();
    const p = part.toLowerCase();
    if (p.startsWith(a)) acc = part; // cumulative: the new part already contains everything so far
    else if (a.endsWith(p)) continue; // exact repeat of the tail
    else acc = `${acc} ${part}`;
  }
  return acc;
}

const noop = () => () => {};

/**
 * Dictation. onText receives the full text dictated in the current session,
 * rebuilt from scratch on every update so repeated events can't duplicate it.
 */
export function useSpeech(onText: (sessionText: string) => void) {
  const supported = useSyncExternalStore(noop, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || rec.current) return;
    setError(null);
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
    let last = "";
    r.onresult = (e) => {
      const finals: string[] = [];
      let live = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finals.push(res[0].transcript);
        else live = res[0].transcript;
      }
      const text = joinResults(finals);
      if (text !== last) {
        last = text;
        onTextRef.current(text);
      }
      // Hide interim text the final transcript already shows.
      setInterim(text.toLowerCase().endsWith(live.trim().toLowerCase()) ? "" : live.trim());
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(e.error === "not-allowed" ? "Microphone access was blocked." : `Dictation error: ${e.error}`);
      }
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
      rec.current = null;
    };
    rec.current = r;
    r.start();
    setListening(true);
  }, []);

  useEffect(() => () => rec.current?.stop(), []);

  return { supported, listening, interim, error, start, stop };
}
