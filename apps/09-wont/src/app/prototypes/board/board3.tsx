"use client";

import { useState } from "react";
import type { DemoState } from "./board";
import type { Mark, VesselProps } from "./vessels";

// Wontons v3 (Define round 3): B's layout rebuilt around the mark (Dough on ink).
// shortcut: hard-coded history for Sat 17 to Fri 23 Oct, replace with the real log and the
// day logic in src/lib once the board is final.
type Day = "k" | "c" | "m" | null;

const BUILD = [
  { id: "up", name: "Up by 7:00", anchor: "After the alarm, I get straight out of bed", prior: ["m", "k", "k", "m", "c", "k", "k"] as Day[], open: "This morning" },
  { id: "write", name: "Write", anchor: "After my morning coffee: a journal entry or a short story", prior: [null, null, "k", "k", "m", "c", "m"] as Day[], open: "Today", comeback: "Friday's page is blank. Today counts." },
  { id: "read", name: "Read 10 pages", anchor: "After dinner", prior: ["m", "k", "k", "m", "c", "k", "k"] as Day[], open: "Tonight" },
  { id: "bed", name: "In bed by 23:00", anchor: "After I brush my teeth", prior: ["m", "m", "c", "k", "m", "c", "k"] as Day[], open: "Tonight" },
];

const WEEK: [string, number, number][] = [["S", 18, 2 / 3], ["M", 19, 3 / 4], ["T", 20, 3 / 4], ["W", 21, 2 / 4], ["T", 22, 3 / 4], ["F", 23, 4 / 5]];

function rate(prior: Day[], loggedToday: boolean) {
  const today: Day = prior[6] === "m" ? "c" : "k";
  const window = loggedToday ? [...prior.slice(1), today] : prior;
  const counted = window.filter((d) => d !== null);
  const marks = counted.filter((d): d is Mark => d === "k" || d === "c");
  return { kept: marks.length, of: counted.length, marks, comeback: loggedToday && today === "c" };
}

type Nic = { status: "clean" | "open" | "asking" | "slip"; size?: string; urges: number };

export function Board3({ title, Vessel, demo = "main" }: { title: string; Vessel: (p: VesselProps) => React.ReactNode; demo?: DemoState }) {
  const [logged, setLogged] = useState<Record<string, boolean>>({ up: true, write: demo === "write" });
  const [fresh, setFresh] = useState<string | null>(demo === "write" ? "write" : null);
  const [nic, setNic] = useState<Nic>(demo === "slip" ? { status: "slip", size: "1", urges: 0 } : { status: "clean", urges: 0 });

  const toggle = (id: string) => {
    const next = !logged[id];
    setLogged({ ...logged, [id]: next });
    setFresh(next ? id : null);
  };
  const keptToday = BUILD.filter((h) => logged[h.id]).length + (nic.status === "clean" ? 1 : 0);
  const clean = nic.status === "clean";
  const pouches = nic.size === "1" ? "1 pouch" : `${nic.size} pouches`;
  const nicStatus =
    nic.status === "clean" ? "Clean so far" :
    nic.status === "open" ? "Tap if clean so far" :
    nic.status === "asking" ? "How many today?" :
    `${pouches} today · 2 clean days still count`;

  return (
    <main className="w3">
      <header className="w3-band">
        <div className="w3-top">
          <h1>{title}</h1>
          <span className="w3-key"><i aria-hidden="true" />share kept each day</span>
        </div>
        <div className="w3-week" aria-label="Share of habits kept each day this week">
          {[...WEEK, ["S", 24, keptToday / 5] as [string, number, number]].map(([l, n, v], i) => (
            <div key={n} className={`w3-day ${i === 6 ? "today" : ""}`} aria-current={i === 6 ? "date" : undefined}>
              <b>{l}</b>
              <span>{n}</span>
              <i style={{ ["--v" as string]: v }} aria-label={`${Math.round(v * 100)}% kept`} />
            </div>
          ))}
        </div>
      </header>

      <div className="w3-cards">
        {BUILD.map((h) => {
          const on = !!logged[h.id];
          const r = rate(h.prior, on);
          return (
            <article key={h.id} className={`w3-card ${on ? "kept" : ""}`}>
              <button type="button" className="w3-hit" aria-pressed={on} aria-label={`${h.name}: ${on ? "kept today, tap to undo" : "tap when kept"}`} onClick={() => toggle(h.id)} />
              <div className="w3-art">
                <Vessel marks={r.marks} fresh={fresh === h.id} />
              </div>
              <div className="w3-body">
                <h2 className="w3-nm">{h.name}</h2>
                <p className="w3-rate">{r.kept} of last {r.of}</p>
                <p className="w3-an">{h.anchor}</p>
                {h.comeback && !on && <p className="w3-cb">{h.comeback}</p>}
                <p className="w3-st">{on ? (r.comeback ? "Comeback" : "Kept") : h.open}</p>
              </div>
            </article>
          );
        })}

        <article className={`w3-card stop ${clean ? "kept" : ""}`}>
          <button type="button" className="w3-hit" aria-pressed={clean} aria-label={`Nicotine pouches: ${clean ? "clean so far, tap to undo" : "tap if clean so far"}`} onClick={() => setNic({ status: clean ? "open" : "clean", urges: nic.urges })} />
          <div className="w3-art">
            <Vessel marks={["k", "k"]} fresh={false} />
          </div>
          <div className="w3-body">
            <h2 className="w3-nm">Nicotine pouches</h2>
            <p className="w3-rate">2 clean days</p>
            <p className="w3-an">After meals, with coffee. Instead: chewing gum</p>
            <p className="w3-st">
              {nicStatus}
              {nic.urges > 0 && ` · ${nic.urges === 1 ? "an urge" : `${nic.urges} urges`} ridden out`}
            </p>
            <div className="w3-quiet">
              {nic.status === "asking" ? (
                ["1", "2", "3+"].map((s) => (
                  <button key={s} type="button" onClick={() => setNic({ ...nic, status: "slip", size: s })}>{s}</button>
                ))
              ) : (
                <>
                  <button type="button" onClick={() => setNic({ ...nic, status: "asking" })}>Slipped</button>
                  <button type="button" onClick={() => setNic({ ...nic, urges: nic.urges + 1 })}>Had an urge</button>
                </>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
