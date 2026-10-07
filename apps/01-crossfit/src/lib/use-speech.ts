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
 * cumulative results ("testing", "testing again") and phrases delivered twice.
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
const isAndroid = () => typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

/**
 * Dictation. onText receives the full text dictated since the mic was tapped,
 * rebuilt on every update so repeated browser events can't duplicate it.
 *
 * Chrome on Android garbles continuous mode (it re-sends and re-recognises
 * earlier audio), so there we listen one phrase at a time: each finished phrase
 * is committed once and listening restarts until the user taps stop.
 */
export function useSpeech(onText: (sessionText: string) => void, debug = false) {
  const supported = useSyncExternalStore(noop, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const rec = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const note = useCallback(
    (line: string) => {
      if (debug) setLog((l) => [...l.slice(-30), `${new Date().toISOString().slice(17, 23)} ${line}`]);
    },
    [debug],
  );

  const stop = useCallback(() => {
    wanted.current = false;
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || rec.current) return;
    setError(null);
    setLog([]);
    wanted.current = true;
    const phraseMode = isAndroid();
    let committed = ""; // text from finished phrases (phrase mode)
    let last = "";
    let silentRuns = 0;
    note(`start, ${phraseMode ? "phrase" : "continuous"} mode, ${navigator.userAgent.slice(0, 60)}`);

    const emit = (text: string) => {
      if (text !== last) {
        last = text;
        onTextRef.current(text);
      }
    };

    const listen = () => {
      const r = new Ctor();
      r.continuous = !phraseMode;
      r.interimResults = true;
      r.lang = navigator.language || "en-US";
      let phrase = "";
      r.onresult = (e) => {
        const finals: string[] = [];
        let live = "";
        const raw: string[] = [];
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          raw.push(`${res.isFinal ? "F" : "i"}:"${res[0].transcript}"`);
          if (res.isFinal) finals.push(res[0].transcript);
          else live = res[0].transcript;
        }
        note(raw.join(" "));
        phrase = joinResults(finals);
        emit(joinResults([committed, phrase]));
        const shown = joinResults([committed, phrase]).toLowerCase();
        setInterim(shown.endsWith(live.trim().toLowerCase()) ? "" : live.trim());
      };
      r.onerror = (e) => {
        note(`error ${e.error}`);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          wanted.current = false;
          setError("Microphone access was blocked. Allow it in the browser's site settings.");
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          setError(`Dictation error: ${e.error}`);
        }
      };
      r.onend = () => {
        note(`end, phrase="${phrase}"`);
        silentRuns = phrase ? 0 : silentRuns + 1;
        committed = joinResults([committed, phrase]);
        emit(committed);
        setInterim("");
        // Phrase mode: keep listening until stopped, or after ~3 silent phrases.
        if (phraseMode && wanted.current && silentRuns < 3) {
          try {
            listen();
            return;
          } catch {
            note("restart failed");
          }
        }
        wanted.current = false;
        rec.current = null;
        setListening(false);
      };
      rec.current = r;
      r.start();
    };

    listen();
    setListening(true);
  }, [note]);

  useEffect(
    () => () => {
      wanted.current = false;
      rec.current?.stop();
    },
    [],
  );

  return { supported, listening, interim, error, start, stop, log };
}
