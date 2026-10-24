"use client";

import { useState } from "react";
import { Steamer3 } from "../board/steamer3";

// Create a stop habit (P13): what to stop, its trigger, one friction step, one replacement.
// Prototype only: nothing is saved.
export function NewStopHabit({ demo }: { demo: "empty" | "filled" | "saved" }) {
  const filled = demo !== "empty";
  const [name, setName] = useState(filled ? "Nicotine pouches" : "");
  const [trigger, setTrigger] = useState(filled ? "After meals and with coffee" : "");
  const [friction, setFriction] = useState(filled ? "Keep the tin in the car, not my pocket" : "");
  const [instead, setInstead] = useState(filled ? "Chewing gum" : "");
  const [saved, setSaved] = useState(demo === "saved");
  const ready = name.trim() && trigger.trim() && instead.trim();

  return (
    <main className="ws">
      <header className="ws-band">
        <span className="ws-back">← Board</span>
        <h1>{saved ? "On your board" : "Something to stop"}</h1>
        <p>{saved ? "Tap the card each day it stays clean. A slip never wipes your clean days." : "Plan for the moment it usually happens."}</p>
      </header>

      <div className="ws-body">
        {!saved && (
          <>
            <div className="ws-field">
              <label htmlFor="name">What do you want to stop?</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nicotine pouches" autoComplete="off" />
            </div>
            <div className="ws-field">
              <label htmlFor="trigger">When does it usually happen?</label>
              <input id="trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="After meals, with coffee" autoComplete="off" />
              <small>The moment and the place. That&apos;s where the plan goes.</small>
            </div>
            <div className="ws-field">
              <label htmlFor="friction">One thing that makes it harder <span style={{ fontWeight: 400, color: "var(--muted)" }}>· optional</span></label>
              <input id="friction" value={friction} onChange={(e) => setFriction(e.target.value)} placeholder="Keep it out of reach" autoComplete="off" />
              <small>Do it once, today. A little effort in the way goes a long way.</small>
            </div>
            <div className="ws-field">
              <label htmlFor="instead">Instead, I will…</label>
              <input id="instead" value={instead} onChange={(e) => setInstead(e.target.value)} placeholder="Chew gum" autoComplete="off" />
              <small>Something to do in that moment, not just something to avoid.</small>
            </div>
          </>
        )}

        <p className="ws-label">{saved ? "Your card" : "Preview"}</p>
        <div className="ws-card">
          <div className="art"><Steamer3 marks={[]} fresh={false} /></div>
          <div>
            <h2 className={name ? "" : "ph"}>{name || "What to stop"}</h2>
            <p className="rate">No clean days yet</p>
            <p className="an">{trigger || instead ? `${trigger}${trigger && instead ? ". " : ""}${instead ? `Instead: ${instead.toLowerCase()}` : ""}` : <span className="ph">Trigger. Instead: …</span>}</p>
            {saved && friction && <p className="an">Done today: {friction.toLowerCase()}</p>}
            <p className="st">Tap if clean so far</p>
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
