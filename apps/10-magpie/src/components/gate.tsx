"use client";

import { useEffect, useState } from "react";
import { loadBook, useBook } from "@/lib/book";
import { Maggie } from "@/components/maggie";

// First run (design A and B): Maggie says hello once per device, then the access code is asked
// once per device (kept in a cookie for a year). Every page sits behind this (R1).

const WELCOMED = "magpie-welcomed";

export function Gate({ children }: { children: React.ReactNode }) {
  const book = useBook();
  const [welcomed, setWelcomed] = useState<boolean | null>(null);
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(WELCOMED) === "1"; } catch {}
    // Reading the device's storage after mount, so the first paint matches the server's.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWelcomed(seen);
  }, []);

  if (welcomed === null || book.status === "loading") return <Paper />;
  if (!welcomed) return <Welcome onNext={() => { try { localStorage.setItem(WELCOMED, "1"); } catch {} setWelcomed(true); }} />;
  if (book.status === "locked") return <Access />;
  if (book.status === "error") return <Trouble />;
  return <>{children}</>;
}

const Paper = () => <main className="flex-1 bg-cream" aria-busy="true" />;

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center gap-[18px] px-7 pt-14 safe-bottom">
      <span className="text-[22px] font-semibold">magpie</span>
      <Maggie pose="hello" size={260} />
      <h1 className="text-center text-[30px] font-semibold leading-[1.15]">Hi! I collect<br />shiny things.</h1>
      <p className="text-center text-[17px] leading-[1.45] text-bark">
        You taste something amazing, snap it, and I&apos;ll turn it into a sticker for your book. You&apos;ll never forget what that wine was called again.
      </p>
      <div className="flex-1" />
      <button type="button" className="btn btn-primary w-full" onClick={onNext}>Let&apos;s go</button>
    </main>
  );
}

function Access() {
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    const r = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }).catch(() => null);
    if (r?.ok) await loadBook();
    else { setWrong(true); setBusy(false); }
  }
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col">
      <form onSubmit={submit} className="flex flex-1 flex-col gap-[18px] px-7 pt-14 safe-bottom">
        <div className="relative h-[150px]">
          <div className="card absolute inset-x-0 bottom-0 h-[70px]" />
          <Maggie pose="head" size={130} className="absolute left-1/2 top-0 -ml-[65px]" />
        </div>
        <h1 className="text-center text-[28px] font-semibold leading-[1.15]">What&apos;s the secret word?</h1>
        <p className="text-center text-[16px] leading-[1.45] text-bark">
          Type your access code once on each phone and laptop. Then your sticker book is the same everywhere.
        </p>
        <label className="mt-2 flex flex-col gap-2">
          <span className="label">Access code</span>
          <input
            type="password" autoComplete="current-password" autoFocus value={code}
            onChange={(e) => { setCode(e.target.value); setWrong(false); }}
            className="field h-14 rounded-2xl px-[18px] text-[20px] tracking-[4px]"
            aria-invalid={wrong} aria-describedby={wrong ? "code-wrong" : undefined}
          />
          {wrong && <span id="code-wrong" role="alert" className="text-[15px] text-link">Hmm, that&apos;s not it. Try again?</span>}
        </label>
        <div className="flex-1" />
        <button type="submit" className="btn btn-primary w-full" disabled={busy || !code.trim()}>{busy ? "Opening…" : "Open my book"}</button>
      </form>
    </main>
  );
}

function Trouble() {
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
      <Maggie pose="head" size={110} />
      <p className="text-[18px]">I can&apos;t reach your book right now.</p>
      <button type="button" className="btn btn-quiet" onClick={() => void loadBook()}>Try again</button>
    </main>
  );
}
