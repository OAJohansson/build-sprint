"use client";

// Settings (L91, L92): the music taste profile and the cost estimate. The profile is a short
// pattern summary Six AM keeps up to date (memory refresh, mentor-memory.ts); the owner can edit
// it, saved as they pause. Locked until there's enough data (TASTE_UNLOCK), with progress. Setup
// (read playlists) is reachable from here only.
import { useEffect, useRef, useState } from "react";
import { SetupDialog } from "@/components/mentor/setup-dialog";
import { useMentorData } from "@/components/mentor/use-mentor-data";
import { Logo } from "@/components/studio/logo";
import { Notice, Unlock } from "@/components/studio/unlock";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import { ago } from "@/lib/ago";
import { money } from "@/lib/mentor/client";
import type { UsageSummary } from "@/lib/mentor/periods";
import { unlockProgress, unlockText } from "@/lib/mentor/taste-unlock";
import s from "./settings.module.css";

const SAVE_AFTER_MS = 900;

export function SettingsView() {
  const data = useMentorData();
  const [text, setText] = useState<string | null>(null);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [setup, setSetup] = useState(false);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
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

  const { api, ready, code, onError } = data;
  useEffect(() => {
    if (!ready || !code) return;
    let live = true;
    api.usage().then((u) => { if (live) setUsage(u); }, onError);
    return () => { live = false; };
  }, [api, ready, code, onError]);

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
  if (!data.profile || !data.unlock || text === null) return <Notice text="Loading…" />;
  const unlock = data.unlock;

  return (
    <div className={s.root}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="settings" />
        <div className={s.right}><SettingsLink current /></div>
      </header>
      <main className={s.main}>
        <section>
          <div className={s.fieldHead}>
            <h1 className={s.h1}>Music taste profile</h1>
            {unlock.unlocked ? (
              <span className={status === "error" ? s.err : s.saved} role="status">
                {status === "saving" ? "Saving…" : status === "error" ? "Not saved" : data.profile.updatedAt ? `Updated ${ago(data.profile.updatedAt)}` : ""}
              </span>
            ) : null}
          </div>
          {unlock.unlocked ? (
            <textarea
              id="taste"
              ref={area}
              aria-label="Music taste profile"
              className={s.profile}
              value={text}
              rows={4}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => { if (timer.current && text !== null) { clearTimeout(timer.current); timer.current = null; void save(text); } }}
            />
          ) : (
            <div className={s.lockedBox}>
              <p className={s.lockedText}>{unlockText(unlock)}</p>
              <p className={s.progress}>{unlockProgress(unlock)}</p>
            </div>
          )}
          <button className={s.btn} onClick={() => setSetup(true)}>Run setup</button>
        </section>

        <section className={s.costSec}>
          <h2 className={s.label}>Mentor cost</h2>
          <p className={s.cost}>{usage ? `est. Today ${money(usage.todayUsd)} · ${usage.month.slice(0, 3)} ${money(usage.monthUsd)}` : "est. Today –"}</p>
        </section>
      </main>
      {setup ? <SetupDialog data={data} onClose={() => { setSetup(false); data.reload(); }} /> : null}
    </div>
  );
}
