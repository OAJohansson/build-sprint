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
import { useLocalStorage } from "@/lib/use-local-storage";
import type { NewPb, Pb, Session, Unit } from "@/lib/types";
import { cn } from "@/lib/utils";

type Overlay =
  | { type: "lift"; movement: string }
  | { type: "pb"; movement?: string }
  | { type: "log" }
  | { type: "celebrate"; pbs: NewPb[] }
  | null;

export default function Home() {
  const [code, setCode] = useLocalStorage("01-crossfit:access-code", "");
  const [unit, setUnit] = useLocalStorage<Unit>("01-crossfit:unit", "kg");
  const [data, setData] = useState<{ sessions: Session[]; pbs: Pb[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pbs" | "calendar">("pbs");
  const [overlay, setOverlay] = useState<Overlay>(null);

  const api = useMemo(() => makeApi(code), [code]);

  const reload = useCallback(async () => {
    try {
      setData(await api.load());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setCode("");
        setError(code ? "That code didn't work." : null);
      } else setError(err instanceof Error ? err.message : "Couldn't load your data.");
    }
  }, [api, code, setCode]);

  useEffect(() => {
    // Loading data on mount (and when the code changes) is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code) reload();
  }, [code, reload]);

  if (!code) return <Unlock error={error} onUnlock={setCode} />;
  if (!data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        {error ? (
          <>
            <p className="text-muted-foreground">{error}</p>
            <BigButton variant="light" onClick={reload}>Try again</BigButton>
          </>
        ) : (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        )}
      </main>
    );
  }

  const { sessions, pbs } = data;
  const close = () => setOverlay(null);

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pb-44 pt-7">
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
          />
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
          <BigButton onClick={() => setOverlay({ type: "log" })}>
            <Mic /> Log class
          </BigButton>
          <nav className="grid grid-cols-[1fr_1fr_auto] items-center text-sm">
            {(["pbs", "calendar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-current={tab === t ? "page" : undefined}
                className={cn("h-11", tab === t ? "font-semibold text-foreground" : "text-muted-foreground")}
              >
                {t === "pbs" ? "PBs" : "Calendar"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUnit(unit === "kg" ? "lb" : "kg")}
              aria-label={`Default unit: ${unit}. Tap to switch`}
              className="h-9 rounded-full border border-input px-3 text-xs text-muted-foreground"
            >
              {unit}
            </button>
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

function Unlock({ error, onUnlock }: { error: string | null; onUnlock: (code: string) => void }) {
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
    </main>
  );
}
