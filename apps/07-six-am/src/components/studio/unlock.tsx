"use client";

// The access code, typed once per device (decision 0020). Pattern from Folio.
import { useState } from "react";
import { Logo } from "./logo";
import s from "./studio.module.css";

export function Unlock({ error, onUnlock }: { error: string | null; onUnlock: (code: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <main className={s.gate}>
      <form
        className={s.gateForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onUnlock(code.trim());
        }}
      >
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <label htmlFor="code">Access code</label>
        <input
          id="code"
          name="access-code"
          type="password"
          autoComplete="current-password"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">Open my tracks</button>
      </form>
    </main>
  );
}

/** Loading or a problem, on the same quiet screen. */
export function Notice({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <main className={s.gate}>
      <div className={s.gateForm}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <p className={s.notice}>{text}</p>
        {action ? <button onClick={action.onClick}>{action.label}</button> : null}
      </div>
    </main>
  );
}
