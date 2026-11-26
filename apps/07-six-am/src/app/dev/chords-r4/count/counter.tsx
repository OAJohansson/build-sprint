"use client";

import { useEffect, useRef, useState } from "react";

const words = (t: string) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/** Polls the iframe until its chords row is there, then counts the visible words (innerText skips display:none). */
export function Counter({ src, w, h }: { src: string; w: number; h: number }) {
  const [out, setOut] = useState("counting");
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const t = setInterval(() => {
      const doc = ref.current?.contentDocument;
      const mid = doc?.querySelector('[class*="middle"]') as HTMLElement | null;
      if (!doc || !mid || !mid.innerText.trim()) return;
      clearInterval(t);
      setTimeout(() => setOut(`middle=${words(mid.innerText)} page=${words(doc.body.innerText)} | ${mid.innerText.replace(/\s+/g, " ")}`), 800);
    }, 300);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <iframe ref={ref} src={src} width={w} height={h} style={{ border: 0 }} />
      <pre id="out">{out}</pre>
    </>
  );
}
