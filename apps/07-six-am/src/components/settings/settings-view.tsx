"use client";

// Settings (M9, L56): "What Six AM has learned about you". My taste as plain text that grows with
// its content (a hairline, no box), saved as you pause; your edits win over what the Mentor
// learns. Beside it: recent updates as was / now, where it came from, and Run setup again (adds).
import { useEffect, useRef, useState } from "react";
import { SetupDialog, SOURCES_KEY, type SetupSource } from "@/components/mentor/setup-dialog";
import { useMentorData } from "@/components/mentor/use-mentor-data";
import { Logo } from "@/components/studio/logo";
import { Notice, Unlock } from "@/components/studio/unlock";
import { ViewsNav } from "@/components/views-nav";
import { ago } from "@/lib/ago";
import type { ProfileNote } from "@/lib/mentor/client";
import { useLocalStorage } from "@/lib/use-local-storage";
import s from "./settings.module.css";

const SAVE_AFTER_MS = 900;
const NO_SOURCES: SetupSource[] = [];

export function SettingsView() {
  const data = useMentorData();
  const [text, setText] = useState<string | null>(null);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [setup, setSetup] = useState(false);
  const [rawSources] = useLocalStorage<SetupSource[]>(SOURCES_KEY, NO_SOURCES);
  const sources = Array.isArray(rawSources) ? rawSources : NO_SOURCES;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);

  // The server's text, unless the owner is mid-edit.
  const serverText = data.profile?.text ?? null;
  const [seen, setSeen] = useState<string | null>(null);
  if (serverText !== seen) {
    setSeen(serverText);
    if (!editing) setText(serverText);
  }

  // Grows with its content (field-sizing where supported, this as the fallback).
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [text]);

  const save = async (value: string) => {
    setStatus("saving");
    try {
      data.setProfile(await data.api.saveProfile(value));
      setStatus("saved");
    } catch (e) {
      data.onError(e);
      setStatus("error");
    } finally {
      // Still typing (a newer save is waiting): keep the text on screen as it is.
      if (!timer.current) setEditing(false);
    }
  };
  const onChange = (v: string) => {
    setEditing(true);
    setText(v);
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void save(v); }, SAVE_AFTER_MS);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (data.locked) return <Unlock error={data.lockError} onUnlock={data.setCode} />;
  if (!data.profile || text === null) return <Notice text="Loading what Six AM has learned…" />;

  const history = [...data.profile.history].reverse().slice(0, 12);
  return (
    <div className={s.root}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="settings" />
      </header>
      <main className={s.main}>
        <div className={s.intro}>
          <h1 className={s.h1}>What Six AM has learned about you</h1>
          <p className={s.lede}>The Mentor reads this before every answer. Change anything: your words win over what it learns.</p>
        </div>
        <section className={s.col}>
          <div className={s.fieldHead}>
            <label htmlFor="taste" className={s.label}>My taste <span className={s.editHint}>· click to edit</span></label>
            <span className={status === "error" ? s.err : s.saved} role="status">
              {status === "saving" ? "Saving…" : status === "error" ? "Not saved. Check the connection; it saves again as you type." : data.profile.updatedAt ? `Saved · ${ago(data.profile.updatedAt)}` : "Empty"}
            </span>
          </div>
          <textarea
            id="taste"
            ref={area}
            className={s.profile}
            value={text}
            rows={3}
            placeholder="Nothing yet. Run setup, or write how you'd describe your taste to a record-shop friend."
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => { if (timer.current && text !== null) { clearTimeout(timer.current); timer.current = null; void save(text); } }}
          />
        </section>
        <aside className={s.side}>
          <h2 className={s.label}>Recent updates</h2>
          {history.length ? (
            <ol className={s.updates}>
              {history.map((u, i) => <Update key={`${u.at}-${i}`} u={u} />)}
            </ol>
          ) : <p className={s.fine}>Nothing yet. Updates appear here as you tag genres, rate suggestions and talk to the Mentor.</p>}

          <h2 className={s.label} style={{ marginTop: 32 }}>Where it came from</h2>
          {sources.length ? (
            <ul className={s.src}>
              {[...sources].reverse().slice(0, 4).map((x) => (
                <li key={x.at}><span className={s.when}>{ago(x.at)}</span> {x.playlists.join(" · ")} <span className={s.dim}>({x.tracks} tracks)</span></li>
              ))}
            </ul>
          ) : <p className={s.fine}>No playlists read yet.</p>}
          <p className={s.fine}>Titles, artists and tags only. Nothing was listened to.</p>
          <button className={s.btn} onClick={() => setSetup(true)}>{sources.length || data.profile.text ? "Run setup again" : "Run setup"}</button>
          <p className={s.fine}>Adds to My taste; it doesn&apos;t replace it.</p>
        </aside>
      </main>
      {setup ? <SetupDialog data={data} onClose={() => setSetup(false)} /> : null}
    </div>
  );
}

/** One line per update; was / now behind a disclosure (critic, round 2). */
function Update({ u }: { u: ProfileNote }) {
  const from = u.from ?? (u.by === "owner" ? "Settings" : "the Mentor");
  const line = (
    <span className={s.updLine}>
      <span className={s.when}>{ago(u.at)}</span>
      <span className={s.updNote}>{u.note.replace(/^Updated:\s*/, "")}</span>
      <span className={s.from}>{u.by === "owner" ? "you" : `from ${from}`}</span>
    </span>
  );
  if (!u.was && !u.now) return <li>{line}</li>;
  return (
    <li>
      <details className={s.details}>
        <summary>{line}</summary>
        <dl className={s.diff}>
          {u.was ? <><dt>was</dt><dd>{u.was}</dd></> : null}
          {u.now ? <><dt>now</dt><dd className={s.own}>{u.now}</dd></> : null}
        </dl>
      </details>
    </li>
  );
}
