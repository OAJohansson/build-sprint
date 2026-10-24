"use client";

// Taste session (M13, L56): two ~10 s snippets from the middle of two analysed tracks, played by
// the SoundCloud player (nothing captured or recorded); which do you prefer and why; the Mentor
// names what you described and adds it to My taste.
import { Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";
import type { EarsAnalysis } from "@/lib/ears/results";
import { ApiError, type AskReply } from "@/lib/mentor/client";
import type { UsageSummary } from "@/lib/mentor/periods";
import { Turn } from "./answer-view";
import { useSnippetPlayer } from "./use-snippet-player";
import type { MentorData } from "./use-mentor-data";
import s from "./mentor.module.css";

const WHY = ["the bassline", "the drums", "the vocal", "the energy", "the mood", "the speed", "the sounds"];

/** Two tracks, preferring ones that differ (another My genre, or another top style). */
function pickPair(list: EarsAnalysis[], seed: number): [EarsAnalysis, EarsAnalysis] | null {
  if (list.length < 2) return null;
  const a = list[seed % list.length];
  const others = list.filter((x) => x.id !== a.id);
  const differ = others.filter((x) => (x.myGenre ?? x.genres[0]?.style) !== (a.myGenre ?? a.genres[0]?.style));
  const pool = differ.length ? differ : others;
  return [a, pool[(seed * 7 + 3) % pool.length]];
}

export function TasteView({ data, library, earsBusy, onClose, onUsage }: { data: MentorData; library: EarsAnalysis[]; earsBusy: boolean; onClose: () => void; onUsage: (u: UsageSummary) => void }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000));
  const pair = useMemo(() => pickPair(library, seed), [library, seed]);
  const [pick, setPick] = useState<"a" | "b" | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<AskReply | null>(null);
  const player = useSnippetPlayer(10);

  if (!pair) {
    return (
      <section className={s.view} aria-label="Taste session">
        <div className={s.viewHead}><h3>Taste session</h3><button className={s.textBtn} onClick={onClose}>Close</button></div>
        <p className={s.lede}>A taste session needs at least 2 analysed tracks ({library.length} so far). Analyse another track, then come back.</p>
      </section>
    );
  }
  const [a, b] = pair;
  const reason = [chips.join(", "), why.trim()].filter(Boolean).join(". ");
  const again = () => { player.stop(); setSeed((x) => x + 1); setPick(null); setChips([]); setWhy(""); setReply(null); setError(null); };

  const send = async () => {
    if (!pick || !reason) return;
    player.stop();
    setBusy(true); setError(null);
    try {
      const r = await data.api.ask({ job: "taste_session", taste: { a: a.id, b: b.id, preferred: pick, why: reason } });
      setReply(r);
      onUsage(r.usage);
      if (r.profileUpdated) data.reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) data.onError(e);
      else setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.view} aria-label="Taste session">
      {player.frame}
      <div className={s.viewHead}><h3>Taste session</h3><button className={s.textBtn} onClick={onClose}>Close</button></div>
      <p className={s.lede}>Play 10 seconds of each. Which do you prefer, and why?</p>
      <ul className={s.pair} role="radiogroup" aria-label="Which do you prefer?">
        {([["a", a], ["b", b]] as const).map(([k, t]) => {
          const playing = player.state.url === t.soundcloudUrl;
          return (
            <li key={k} data-picked={pick === k || undefined}>
              <button
                className={s.play}
                disabled={earsBusy || !!reply}
                title={earsBusy ? "Wait until Ears has finished the track it's analysing" : undefined}
                aria-label={`${playing ? "Stop" : "Play"} 10 seconds of ${t.title}`}
                onClick={() => (playing ? player.stop() : void player.play(t.soundcloudUrl))}
              >
                {playing ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
              </button>
              <button role="radio" aria-checked={pick === k} className={s.pick} disabled={!!reply} onClick={() => setPick(k)}>
                <span>{k.toUpperCase()} · {t.title || "Untitled"}</span>
                <span>{t.uploader}{playing ? (player.state.status === "loading" ? " · loading…" : " · playing") : ""}</span>
              </button>
              <span className={s.radio} aria-hidden="true" />
            </li>
          );
        })}
      </ul>
      {player.state.error ? <p className={s.error}>{player.state.error}</p> : null}

      {!reply ? (
        <>
          <div className={s.chips} role="group" aria-label="Why">
            {WHY.map((w) => (
              <button key={w} className={s.chip} aria-pressed={chips.includes(w)} onClick={() => setChips((c) => (c.includes(w) ? c.filter((x) => x !== w) : [...c, w]))}>{w}</button>
            ))}
          </div>
          <input className={s.field} style={{ marginTop: 10 }} aria-label="Why, in your words" placeholder="In your words (optional)" value={why} onChange={(e) => setWhy(e.target.value)} />
          <div className={s.actions}>
            <button className={s.btn} onClick={send} disabled={!pick || !reason || busy}>{busy ? "Thinking…" : "Send"}</button>
            <button className={s.textBtn} onClick={again} disabled={busy}>Another pair</button>
            {!pick ? <span className={s.noted}>Pick one, then say why</span> : null}
          </div>
          {error ? <p className={s.error} role="alert">{error}</p> : null}
        </>
      ) : (
        <>
          <Turn ask={`I prefer ${pick === "a" ? a.title : b.title}: ${reason}`} job="taste_session" answer={reply.answer} track={null} />
          <div className={s.actions}><button className={s.textBtn} onClick={again}>Another pair</button></div>
        </>
      )}
    </section>
  );
}
