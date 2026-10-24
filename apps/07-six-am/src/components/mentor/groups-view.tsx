"use client";

// Genres that grow from the library (M12, L50): the Mentor proposes groups among tagged tracks,
// each with a name and a reason from the tracks' own numbers; accept, rename, split or dismiss.
// Accepted names join My genre suggestions (L55).
import { useState } from "react";
import { cleanGenre } from "@/lib/ears/my-genre";
import type { EarsAnalysis } from "@/lib/ears/results";
import { ApiError, type Group } from "@/lib/mentor/client";
import type { UsageSummary } from "@/lib/mentor/periods";
import type { MentorData } from "./use-mentor-data";
import s from "./mentor.module.css";

const MIN_TAGGED = 4;

export function GroupsView({ data, library, onClose, onUsage }: { data: MentorData; library: EarsAnalysis[]; onClose: () => void; onUsage: (u: UsageSummary) => void }) {
  const tagged = library.filter((a) => cleanGenre(a.myGenre)).length;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = data.groups.filter((g) => g.status !== "dismissed");

  const propose = async () => {
    setBusy(true); setError(null); setNote(null);
    try {
      const r = await data.api.proposeGroups();
      onUsage(r.usage);
      const fresh = r.groups ?? [];
      data.setGroups((g) => [...fresh, ...g]);
      setNote(fresh.length ? r.answer.sentences.map((x) => x.text).join(" ") : `Nothing grouped well yet. ${r.answer.sentences.map((x) => x.text).join(" ")}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) data.onError(e);
      else setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (body: Parameters<MentorData["api"]["patchGroup"]>[0]) => {
    setError(null);
    try {
      const r = await data.api.patchGroup(body);
      data.setGroups((list) => {
        if (r.groups) return [...r.groups, ...list.filter((x) => x.id !== body.id)];
        return r.group ? list.map((x) => (x.id === r.group!.id ? r.group! : x)) : list;
      });
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) data.onError(e);
      else setError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    }
  };

  return (
    <section className={s.view} aria-label="Genre groups">
      <div className={s.viewHead}>
        <h3>Genre groups</h3>
        <button className={s.textBtn} onClick={onClose}>Back to the thread</button>
      </div>
      <p className={s.lede}>Groups among your tagged tracks, named from what they share. Accept one and its name joins your My genre suggestions.</p>
      <div className={s.row}>
        <button className={s.btn} onClick={propose} disabled={busy || tagged < MIN_TAGGED}>
          {busy ? "Looking across your tagged tracks…" : shown.length ? "Propose more groups" : "Propose groups"}
        </button>
        {tagged < MIN_TAGGED ? <span className={s.noted}>Tag at least {MIN_TAGGED} tracks with My genre first ({tagged} so far).</span> : <span className={s.noted}>{tagged} tagged tracks</span>}
      </div>
      {note ? <p className={s.voice} style={{ marginTop: 12 }}>{note}</p> : null}
      {error ? <p className={s.error} role="alert">{error}</p> : null}
      <div style={{ marginTop: 16 }}>
        {shown.map((g) => <GroupRow key={g.id} g={g} library={library} patch={patch} />)}
      </div>
    </section>
  );
}

type Patch = (body: Parameters<MentorData["api"]["patchGroup"]>[0]) => Promise<boolean>;

function GroupRow({ g, library, patch }: { g: Group; library: EarsAnalysis[]; patch: Patch }) {
  const [mode, setMode] = useState<"view" | "rename" | "split">("view");
  const [name, setName] = useState(g.name);
  const [second, setSecond] = useState<string[]>([]);
  const [names, setNames] = useState<[string, string]>([g.name, ""]);
  const title = (id: string) => {
    const a = library.find((x) => x.id === id);
    return a ? `${a.title || "Untitled"} · ${a.uploader}` : id.replace(/^https?:\/\/(www\.)?soundcloud\.com\//, "");
  };
  const first = g.trackIds.filter((id) => !second.includes(id));
  const canSplit = first.length > 0 && second.length > 0 && cleanGenre(names[0]) && cleanGenre(names[1]);

  return (
    <div className={s.group}>
      {mode === "rename" ? (
        <form className={s.row} style={{ marginTop: 0 }} onSubmit={async (e) => { e.preventDefault(); if (cleanGenre(name) && (await patch({ id: g.id, action: "rename", name }))) setMode("view"); }}>
          {/* F7: the old name is selected on focus, so typing replaces it instead of appending. */}
          <input className={s.input} aria-label="Group name" value={name} onChange={(e) => setName(e.target.value)} onFocus={(e) => e.currentTarget.select()} autoFocus style={{ flex: "1 1 160px" }} />
          <button className={s.btn} disabled={!cleanGenre(name)}>Save</button>
          <button type="button" className={s.textBtn} onClick={() => { setName(g.name); setMode("view"); }}>Cancel</button>
        </form>
      ) : (
        <p className={s.groupName}>{g.name}<small>{g.status === "accepted" ? "accepted" : "proposed"} · {g.trackIds.length} track{g.trackIds.length === 1 ? "" : "s"}</small></p>
      )}
      <p className={s.groupReason}>{g.reason}</p>

      {mode === "split" ? (
        <>
          <p className={s.lede} style={{ margin: "8px 0 0" }}>Tick the tracks that go into the second group, and name both.</p>
          <ul className={s.groupTracks}>
            {g.trackIds.map((id) => (
              <li key={id}>
                <label>
                  <input type="checkbox" checked={second.includes(id)} onChange={(e) => setSecond((x) => (e.target.checked ? [...x, id] : x.filter((y) => y !== id)))} />
                  {title(id)}
                </label>
              </li>
            ))}
          </ul>
          <div className={s.row}>
            <input className={s.input} aria-label="First group's name" value={names[0]} onChange={(e) => setNames([e.target.value, names[1]])} style={{ flex: "1 1 120px" }} />
            <input className={s.input} aria-label="Second group's name" placeholder="Second name" value={names[1]} onChange={(e) => setNames([names[0], e.target.value])} style={{ flex: "1 1 120px" }} />
          </div>
          <div className={s.row}>
            <button className={s.btn} disabled={!canSplit} onClick={() => void patch({ id: g.id, action: "split", parts: [{ name: names[0], trackIds: first }, { name: names[1], trackIds: second }] })}>Split in two</button>
            <button className={s.textBtn} onClick={() => { setSecond([]); setMode("view"); }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <p className={s.groupLine} title={g.trackIds.map(title).join("\n")}>{g.trackIds.map((id) => title(id).split(" · ")[0]).join(" · ")}</p>
          {mode === "view" ? (
            <div className={s.actions}>
              {g.status === "proposed" ? <button className={s.btn} onClick={() => void patch({ id: g.id, action: "accept" })}>Accept</button> : null}
              <button className={s.textBtn} onClick={() => { setName(g.name); setMode("rename"); }}>Rename</button>
              {g.trackIds.length >= 2 ? <button className={s.textBtn} onClick={() => setMode("split")}>Split</button> : null}
              {g.status === "proposed" ? <button className={s.textBtn} onClick={() => void patch({ id: g.id, action: "dismiss" })}>Dismiss</button> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
