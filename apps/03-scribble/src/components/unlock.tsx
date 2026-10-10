"use client";

import { useState } from "react";

export function Unlock({ error, onUnlock }: { error: string | null; onUnlock: (code: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <main className="sc sc-gate">
      <form
        className="sc-gate-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onUnlock(code.trim());
        }}
      >
        <h1 className="sc-gate-title">SCRIBBLE</h1>
        <p className="sc-gate-sub">a few sentences a day</p>
        <label className="sc-gate-label" htmlFor="code">
          access code
        </label>
        <input
          id="code"
          className="sc-gate-input"
          name="access-code"
          type="password"
          autoComplete="current-password"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        {error && <p className="sc-notice" role="alert">{error}</p>}
        <button className="sc-link sc-main" type="submit">
          open the notebook
        </button>
      </form>
    </main>
  );
}
