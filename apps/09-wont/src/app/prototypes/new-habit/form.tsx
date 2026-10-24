"use client";

import { useState } from "react";
import { Steamer3 } from "../board/steamer3";

// Create a build habit as an if-then commitment (P1), a daily goal that's clearly met or not,
// and an optional "why this matters to me" (P11). Prototype only: nothing is saved.
const GOALS = ["10 pages", "Up by 7:00", "One sentence", "20 minutes"];

export function NewHabit({ demo }: { demo: "empty" | "filled" | "saved" }) {
  const filled = demo !== "empty";
  const [after, setAfter] = useState(filled ? "I make my morning coffee" : "");
  const [will, setWill] = useState(filled ? "write in my journal" : "");
  const [goal, setGoal] = useState(filled ? "One sentence" : "");
  const [why, setWhy] = useState(filled ? "I want to remember this year, not just get through it." : "");
  const [saved, setSaved] = useState(demo === "saved");
  const ready = after.trim() && will.trim() && goal.trim();
  const name = will.trim() ? will.trim()[0].toUpperCase() + will.trim().slice(1) : "";

  return (
    <main className="ws">
      <header className="ws-band">
        <span className="ws-back">← Board</span>
        <h1>{saved ? "On your board" : "A new promise"}</h1>
        <p>{saved ? "It starts today. Tap the card when it's done." : "Tie it to something you already do every day."}</p>
      </header>

      <div className="ws-body">
        {!saved && (
          <>
            <div className="ws-field">
              <label htmlFor="after">After I…</label>
              <input id="after" value={after} onChange={(e) => setAfter(e.target.value)} placeholder="make my morning coffee" autoComplete="off" />
              <small>Something you already do every day, at about the right time.</small>
            </div>
            <div className="ws-field">
              <label htmlFor="will">I will…</label>
              <input id="will" value={will} onChange={(e) => setWill(e.target.value)} placeholder="write in my journal" autoComplete="off" />
            </div>
            <div className="ws-field">
              <label htmlFor="goal">Done when</label>
              <input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="One sentence" autoComplete="off" />
              <small>Small and clear, so each day it&apos;s plainly kept or not. You can grow it later.</small>
              <div className="ws-chips">
                {GOALS.map((g) => (
                  <button key={g} type="button" onClick={() => setGoal(g)} aria-pressed={goal === g}>{g}</button>
                ))}
              </div>
            </div>
            <div className="ws-field">
              <label htmlFor="why">Why this matters to me <span style={{ fontWeight: 400, color: "var(--muted)" }}>· optional</span></label>
              <textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="In your own words" />
            </div>
          </>
        )}

        <p className="ws-label">{saved ? "Your card" : "Preview"}</p>
        <div className="ws-card">
          <div className="art"><Steamer3 marks={[]} fresh={false} /></div>
          <div>
            <h2 className={name ? "" : "ph"}>{name || "I will…"}</h2>
            <p className="rate">{goal ? `Done when: ${goal}` : "New, no days yet"}</p>
            <p className="an">{after ? `After ${after}` : <span className="ph">After I…</span>}</p>
            {saved && why && <p className="an" style={{ fontStyle: "italic" }}>{why}</p>}
            <p className="st">Today</p>
          </div>
        </div>

        {saved ? (
          <button type="button" className="ws-primary" onClick={() => setSaved(false)}>Back to the board</button>
        ) : (
          <button type="button" className="ws-primary" disabled={!ready} onClick={() => setSaved(true)}>Add to my board</button>
        )}
      </div>
    </main>
  );
}
