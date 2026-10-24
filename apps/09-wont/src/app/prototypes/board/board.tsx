"use client";

import { useState } from "react";
import type { Mark, VesselProps } from "./vessels";

// Prototype only: real data from the kickoff, kept in component state (not saved).
// shortcut: hard-coded history for Sat 17 to Fri 23 Oct, replace with the real log and the
// day logic in src/lib once the board is picked.
type Day = "k" | "c" | "m" | null; // kept, comeback (kept after a miss), not kept, before start

type BuildHabit = {
  id: string;
  name: string;
  anchor: string;
  prior: Day[]; // Sat 17 .. Fri 23
  loggedLabel: string;
  openLabel: string;
};

const BUILD: BuildHabit[] = [
  { id: "up", name: "Up by 7:00", anchor: "After the alarm, I get straight out of bed", prior: ["m", "k", "k", "m", "c", "k", "k"], loggedLabel: "Kept this morning", openLabel: "Tap when you're up" },
  { id: "write", name: "Write", anchor: "After my morning coffee: a journal entry or a short story", prior: [null, null, "k", "k", "m", "c", "m"], loggedLabel: "Kept today", openLabel: "Tap when written" },
  { id: "read", name: "Read 10 pages", anchor: "After dinner", prior: ["m", "k", "k", "m", "c", "k", "k"], loggedLabel: "Kept tonight", openLabel: "Tonight" },
  { id: "bed", name: "In bed by 23:00", anchor: "After I brush my teeth", prior: ["m", "m", "c", "k", "m", "c", "k"], loggedLabel: "Kept tonight", openLabel: "Tonight" },
];

// Share of habits kept, Sun 18 .. Fri 23 (today is computed).
const WEEK: [string, number, number][] = [["S", 18, 0.67], ["M", 19, 0.75], ["T", 20, 0.75], ["W", 21, 0.5], ["T", 22, 0.75], ["F", 23, 0.8]];

function rate(prior: Day[], loggedToday: boolean) {
  const today: Day = prior[6] === "m" ? "c" : "k";
  const window = loggedToday ? [...prior.slice(1), today] : prior;
  const counted = window.filter((d) => d !== null);
  const marks = counted.filter((d): d is Mark => d === "k" || d === "c");
  return { kept: marks.length, of: counted.length, marks, todayIsComeback: loggedToday && today === "c" };
}

export type DemoState = "main" | "write" | "slip";

type Nic = { status: "clean" | "asking" | "slip"; size?: string; urges: number };

export function Board({ title, Vessel, demo = "main" }: { title: string; Vessel: (p: VesselProps) => React.ReactNode; demo?: DemoState }) {
  const [logged, setLogged] = useState<Record<string, boolean>>({ up: true, write: demo === "write" });
  const [fresh, setFresh] = useState<string | null>(demo === "write" ? "write" : null);
  const [nic, setNic] = useState<Nic>(demo === "slip" ? { status: "slip", size: "1", urges: 0 } : { status: "clean", urges: 0 });

  const toggle = (id: string) => {
    const next = !logged[id];
    setLogged({ ...logged, [id]: next });
    setFresh(next ? id : null);
  };

  const keptToday = BUILD.filter((h) => logged[h.id]).length + (nic.status === "clean" ? 1 : 0);

  return (
    <main className="wb">
      <header className="wb-top">
        <h1>{title}</h1>
        <span>24 Oct</span>
      </header>

      <div className="wb-week" aria-label="This week">
        {WEEK.map(([l, n, v]) => (
          <div key={n} className="wb-day">
            <b>{l}</b>
            <span>{n}</span>
            <i style={{ opacity: 0.2 + v * 0.8 }} />
          </div>
        ))}
        <div className="wb-day today" aria-current="date">
          <b>S</b>
          <span>24</span>
          <i style={{ ["--v" as string]: keptToday / 5 }} />
        </div>
      </div>

      <div className="wb-cards">
        {BUILD.map((h) => {
          const on = !!logged[h.id];
          const r = rate(h.prior, on);
          const missedYesterday = h.prior[6] === "m";
          return (
            <button key={h.id} type="button" className={`wb-card ${on ? "kept" : ""}`} aria-pressed={on} onClick={() => toggle(h.id)}>
              <div className="wb-art">
                <Vessel marks={r.marks} fresh={fresh === h.id} />
              </div>
              <div className="wb-body">
                <div className="wb-hd">
                  <span className="wb-nm">{h.name}</span>
                  <span className="wb-num">
                    {r.kept}
                    <small>of last {r.of}</small>
                  </span>
                </div>
                <span className="wb-an">{h.anchor}</span>
                {missedYesterday && !on && <span className="wb-cb">Friday&apos;s page stayed empty. That&apos;s part of it. One sentence after your coffee today.</span>}
                {r.todayIsComeback && <span className="wb-cb done">Comeback. Friday stayed empty, and you came back today.</span>}
                <span className="wb-tap">
                  {on ? (fresh === h.id ? `Kept. ${r.kept} of last ${r.of}.` : h.loggedLabel) : h.openLabel}
                  {on && <em> · tap to undo</em>}
                </span>
              </div>
            </button>
          );
        })}

        <section className="wb-card stop" aria-label="Nicotine pouches">
          <div className="wb-art">
            <Vessel marks={["k", "k"]} fresh={false} pending={nic.status === "clean"} />
          </div>
          <div className="wb-body">
            <div className="wb-hd">
              <span className="wb-nm">Nicotine pouches</span>
              <span className="wb-num">
                2<small>clean days</small>
              </span>
            </div>
            <p className="wb-an">After meals, with coffee. Instead: chewing gum</p>
            {nic.status === "asking" && (
              <div className="wb-ask">
                <span>How many today?</span>
                {["1", "2", "3+"].map((s) => (
                  <button key={s} type="button" onClick={() => setNic({ ...nic, status: "slip", size: s })}>{s}</button>
                ))}
              </div>
            )}
            {nic.status === "slip" && (
              <p className="wb-note">
                Logged: {nic.size} {nic.size === "1" ? "pouch" : "pouches"}. Your two clean days still count. Next coffee: gum first.
              </p>
            )}
            {nic.urges > 0 && (
              <p className="wb-note">Urge noted ({nic.urges} today). It passes in a few minutes; chew gum and let it go by.</p>
            )}
            <div className="wb-seg">
              <button type="button" aria-pressed={nic.status === "clean"} onClick={() => setNic({ ...nic, status: "clean", size: undefined })}>
                Clean so far
              </button>
              <button type="button" aria-pressed={nic.status !== "clean"} onClick={() => setNic({ ...nic, status: "asking" })}>
                {nic.status === "slip" ? `Slip · ${nic.size}` : "Slip"}
              </button>
              <button type="button" onClick={() => setNic({ ...nic, urges: nic.urges + 1 })}>Urge</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
