"use client";

// The Mentor's chat pieces in the Lab (S2; L167, L171): one exchange (your question right in a
// light bubble with a "bar N" tag that jumps the playhead, the answer left as plain text, the
// measured facts as one mono line) and the composer (Enter sends, Shift+Enter is a new line, the
// Send arrow is dimmed until there's text). Shared by the Listen card and, in S3, Make's rail.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * T110: a scrolling thread fades 32 px at an edge only while there is more to scroll there, so
 * nothing at rest is clipped mid-shape (data-above / data-below drive the mask in the CSS).
 */
export function useEdgeFades(ref: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => {
      el.toggleAttribute("data-above", el.scrollTop > 2);
      el.toggleAttribute("data-below", el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    };
    set();
    el.addEventListener("scroll", set, { passive: true });
    const ro = new ResizeObserver(set);
    ro.observe(el);
    for (const c of Array.from(el.children)) ro.observe(c);
    return () => { el.removeEventListener("scroll", set); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}
import type { MentorAnswer } from "@/lib/mentor/answer";
import s from "./lab.module.css";

/** One exchange as the thread shows it; `answer` null while the Mentor is thinking. */
export type ThreadTurn = { id: string; bar: number; q: string; answer: MentorAnswer | null; facts: string; error?: string };

export function Turn({ x, lines, onSeek, onRetry, current, showFacts = true }: { x: ThreadTurn; lines: number; onSeek: (bar: number) => void; onRetry?: () => void; current?: boolean; showFacts?: boolean }) {
  return (
    <div className={s.turn} data-current={current ? "" : undefined}>
      <div className={s.mine}>
        <p className={s.bubble}>{x.q}</p>
        <button className={s.barTag} onClick={() => onSeek(x.bar)} aria-label={`Jump to bar ${x.bar}`}>bar {x.bar}</button>
      </div>
      {x.error ? (
        <p className={s.answer} role="alert">{x.error}{onRetry && <> <button className={s.textBtn} onClick={onRetry}>Try again</button></>}</p>
      ) : x.answer ? (
        <>
          <Answer text={x.answer.sentences.map((t) => t.text).join(" ")} lines={lines} />
          {x.facts && showFacts && <p className={s.facts} title="Measured from the looped part">{x.facts}</p>}
        </>
      ) : (
        <p className={`${s.answer} ${s.thinking}`} aria-live="polite">Thinking…</p>
      )}
    </div>
  );
}

/** A long answer shows a few lines and "Read all". */
function Answer({ text, lines }: { text: string; lines: number }) {
  const [all, setAll] = useState(false);
  // "Read all" only for a really long answer (LS2-M1); everything else shows whole.
  const long = text.length > lines * 52;
  return (
    <>
      <p className={s.answer} data-clamp={long && !all ? "" : undefined} data-expanded={long && all ? "" : undefined} style={{ WebkitLineClamp: lines }}>{text}</p>
      {long && <button className={s.textBtn} onClick={() => setAll(!all)} aria-expanded={all}>{all ? "Show less" : "Read all"}</button>}
    </>
  );
}

/** Chat input: grows to 4 lines; Enter sends, Shift+Enter is a new line; the arrow sits inside on the right. */
export function Composer({ placeholder, onAsk, autoFocus, disabled }: { placeholder: string; onAsk: (q: string) => void; autoFocus?: boolean; disabled?: boolean }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 4 * 20 + 18)}px`;
  }, [q]);
  const send = () => { if (q.trim() && !disabled) { onAsk(q.trim()); setQ(""); } };
  return (
    <form className={s.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <textarea ref={ref} className={s.ask} name="question" rows={1} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} maxLength={2000}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
        placeholder={placeholder} aria-label="Ask the Mentor" aria-describedby="lab-composer-hint" autoFocus={autoFocus} />
      <button type="submit" className={s.send} disabled={!q.trim() || disabled} aria-label="Send">↑</button>
      <span id="lab-composer-hint" hidden>Enter sends, Shift+Enter adds a line</span>
    </form>
  );
}
