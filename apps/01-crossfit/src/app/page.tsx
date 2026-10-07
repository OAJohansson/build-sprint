"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { CalendarView } from "@/components/calendar-view";
import { Celebrate } from "@/components/celebrate";
import { LiftDetail } from "@/components/lift-detail";
import { LogFlow } from "@/components/log-flow";
import { PbBoard } from "@/components/pb-board";
import { PbForm } from "@/components/pb-form";
import { BigButton, inputClass } from "@/components/ui/bits";
import { ApiError, api as makeApi } from "@/lib/api";
import { DEMO_NOTE, demoApi } from "@/lib/demo";
import { useLocalStorage } from "@/lib/use-local-storage";
import { type NewPb, type Pb, type Session, type Unit, today } from "@/lib/types";
import { cn } from "@/lib/utils";

type Overlay =
  | { type: "lift"; movement: string }
  | { type: "pb"; movement?: string }
  | { type: "log"; session?: Session }
  | { type: "celebrate"; pbs: NewPb[] }
  | null;

export default function Home() {
  const [code, setCode] = useLocalStorage("01-crossfit:access-code", "");
  // Everything is in kg for now (feedback #8).
  const unit: Unit = "kg";
  const [data, setData] = useState<{ sessions: Session[]; pbs: Pb[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pbs" | "calendar">("pbs");
  const [overlay, setOverlay] = useState<Overlay>(null);

  // Demo mode: sample data in this tab only, for visitors without the access code.
  const [demo, setDemo] = useState(false);
  const api = useMemo(() => (demo ? demoApi(today()) : makeApi(code)), [demo, code]);

  const reload = useCallback(async (): Promise<boolean> => {
    try {
      setData(await api.load());
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setCode("");
        setError(code ? "That code didn't work." : null);
      } else setError(err instanceof Error ? err.message : "Something went wrong. Please try again later.");
      return false;
    }
  }, [api, code, setCode]);

  // A failed retry comes back in milliseconds; keep the button busy briefly so
  // the tap visibly does something, and say so when it fails again.
  const [retrying, setRetrying] = useState(false);
  const [failedRetries, setFailedRetries] = useState(0);
  const retry = async () => {
    setRetrying(true);
    const [ok] = await Promise.all([reload(), new Promise((r) => setTimeout(r, 800))]);
    setRetrying(false);
    setFailedRetries((n) => (ok ? 0 : n + 1));
  };

  useEffect(() => {
    // Loading data on mount (and when the code changes) is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code || demo) reload();
  }, [code, demo, reload]);

  if (!code && !demo) return <Unlock error={error} onUnlock={setCode} onDemo={() => setDemo(true)} />;
  if (!data) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
        {error ? (
          <>
            <h1 className="font-display text-3xl font-bold uppercase">Couldn&rsquo;t load your log</h1>
            <p className="text-muted-foreground">{error}</p>
            <BigButton variant="light" className="w-full" disabled={retrying} onClick={retry}>
              {retrying ? <Loader2 className="animate-spin" /> : null}
              {retrying ? "Trying again…" : "Try again"}
            </BigButton>
            {failedRetries > 0 && !retrying && (
              <p className="text-sm text-muted-foreground">Still not working. Give it a few minutes and try again.</p>
            )}
            <button
              type="button"
              className="h-11 text-sm text-muted-foreground underline underline-offset-4"
              onClick={() => {
                setError(null);
                setCode("");
              }}
            >
              Enter the access code again
            </button>
          </>
        ) : (
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
        )}
      </main>
    );
  }

  const { sessions, pbs } = data;
  const close = () => setOverlay(null);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pb-44 pt-7">
        {demo && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Demo with sample data. Nothing you do is saved.</span>
            <button
              type="button"
              className="h-9 flex-none font-semibold text-primary"
              onClick={() => {
                setDemo(false);
                setData(null);
                setOverlay(null);
              }}
            >
              Exit demo
            </button>
          </div>
        )}
        {error && <p className="rounded-xl bg-card px-4 py-3 text-sm text-destructive">{error}</p>}
        {tab === "pbs" ? (
          <PbBoard
            pbs={pbs}
            sessions={sessions}
            onOpen={(movement) => setOverlay({ type: "lift", movement })}
            onAddPb={() => setOverlay({ type: "pb" })}
            onCalendar={() => setTab("calendar")}
          />
        ) : (
          <CalendarView
            sessions={sessions}
            onDelete={async (s) => {
              try {
                await api.deleteSession(s.id);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Couldn't delete.");
              }
              reload();
            }}
            onEdit={(session) => setOverlay({ type: "log", session })}
          />
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
          <BigButton onClick={() => setOverlay({ type: "log" })}>
            <Mic /> Log class
          </BigButton>
          <nav className="grid grid-cols-2 items-center text-sm">
            {(["pbs", "calendar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-current={tab === t ? "page" : undefined}
                className={cn("h-11", tab === t ? "font-semibold text-foreground" : "text-muted-foreground")}
              >
                {t === "pbs" ? "Home" : "Calendar"}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {overlay?.type === "lift" && (
        <LiftDetail
          movement={overlay.movement}
          pbs={pbs}
          sessions={sessions}
          onBack={close}
          onUpdate={() => setOverlay({ type: "pb", movement: overlay.movement })}
          onDeletePb={async (pb) => {
            await api.deletePb(pb.id).catch((err) => setError(err.message));
            reload();
          }}
        />
      )}
      {overlay?.type === "pb" && (
        <PbForm
          movement={overlay.movement}
          unit={unit}
          pbs={pbs}
          onClose={close}
          onSave={async (input) => {
            const { pb, previous, isBest } = await api.addPb(input);
            await reload();
            setOverlay(isBest && previous ? { type: "celebrate", pbs: [{ pb, previous }] } : { type: "lift", movement: pb.movement });
          }}
        />
      )}
      {overlay?.type === "log" && (
        <LogFlow
          key={overlay.session?.id ?? "new"}
          editing={overlay.session}
          sampleNote={demo ? DEMO_NOTE : undefined}
          api={api}
          pbs={pbs}
          unit={unit}
          onClose={close}
          onSaved={async (newPbs) => {
            await reload();
            const beaten = newPbs.filter((n) => n.previous);
            setTab("calendar");
            setOverlay(beaten.length ? { type: "celebrate", pbs: beaten } : null);
          }}
        />
      )}
      {overlay?.type === "celebrate" && <Celebrate pbs={overlay.pbs} onDone={() => { setTab("pbs"); close(); }} />}
    </>
  );
}

function Unlock({ error, onUnlock, onDemo }: { error: string | null; onUnlock: (code: string) => void; onDemo: () => void }) {
  const [value, setValue] = useState("");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-5xl font-bold uppercase">CrossFit Log</h1>
        <p className="text-lg text-muted-foreground">Your PBs, ready when the coach says 70%. Log class by voice.</p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onUnlock(value.trim());
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Access code</span>
          <input className={inputClass} type="password" autoComplete="current-password" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <BigButton type="submit" variant="light" disabled={!value.trim()}>
          Unlock
        </BigButton>
      </form>
      <p className="text-sm text-muted-foreground">A personal log for now. Enter it once and this device remembers it.</p>
      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <BigButton variant="outline" onClick={onDemo}>
          Try the demo
        </BigButton>
        <p className="text-center text-sm text-muted-foreground">Eight weeks of sample training. Nothing is saved.</p>
      </div>
    </main>
  );
}
