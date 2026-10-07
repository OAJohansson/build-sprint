"use client";

// The app: finds the place (your location, or a searched city), keeps the clock ticking, and
// remembers your last choice on this device. Rendered in the browser only (see page.tsx).
import { useCallback, useEffect, useState } from "react";
import { currentPosition, herePlace, terrainFor } from "@/lib/places";
import { gradient, sky, type Place } from "@/lib/sun";
import { ArcHome } from "./arc-home";
import { Landmark } from "./landmark";
import { PlaceSearch } from "./place-search";
import "./horizon.css";

const KEY = "horizon:last";
// `here` on a searched place means location worked before, so the app reopens on it (F2).
type Last = { kind: "here" } | { kind: "place"; place: Place; here?: boolean };

function readLast(): Last | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Last) : null;
  } catch {
    return null;
  }
}
function saveLast(last: Last) {
  try {
    localStorage.setItem(KEY, JSON.stringify(last));
  } catch {
    // Private mode or storage off: the app still works, it just won't remember.
  }
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 1000);
    // Timers are slowed in background tabs; catch up as soon as the app is visible again.
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return now;
}

type HereResult = { place: Place } | { note: string };

async function findHere(): Promise<HereResult> {
  try {
    const pos = await currentPosition();
    return { place: await herePlace(pos.coords.latitude, pos.coords.longitude) };
  } catch (e) {
    const denied = (e as GeolocationPositionError)?.code === 1;
    console.warn("[horizon] location unavailable", e);
    return {
      note: denied
        ? "Location is off for Horizon. Search for a place, or allow location in your browser’s settings."
        : "Couldn’t find your location. Search for a place instead.",
    };
  }
}

export default function HorizonApp() {
  const now = useNow();
  const [last] = useState(readLast);
  // Location worked before: always reopen there, never on yesterday's searched city (F2).
  const [usedHere] = useState(() => last?.kind === "here" || (last?.kind === "place" && !!last.here));
  const [place, setPlace] = useState<Place | null>(last?.kind === "place" && !usedHere ? last.place : null);
  const [locating, setLocating] = useState(usedHere);
  const [search, setSearch] = useState<{ note?: string } | null>(null);

  // Finding the location is kept apart from updating the screen, which happens once it arrives.
  const show = useCallback((r: HereResult) => {
    setLocating(false);
    if ("place" in r) {
      setPlace(r.place);
      saveLast({ kind: "here" });
      setSearch(null);
    } else {
      setSearch({ note: r.note });
    }
  }, []);

  const locate = useCallback(() => {
    setLocating(true);
    void findHere().then(show);
  }, [show]);

  // On open: your location if you chose it before (or already allowed it); otherwise your last
  // searched place; otherwise the welcome screen.
  useEffect(() => {
    if (usedHere) {
      void findHere().then(show);
      return;
    }
    if (last?.kind === "place") return;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted") locate();
      })
      .catch(() => {});
  }, [last, usedHere, show, locate]);

  // No landmark here: look up the terrain once and show a coast, mountain or city scene (#22).
  useEffect(() => {
    if (!place || place.landmark !== "none" || place.terrainChecked) return;
    let live = true;
    void terrainFor(place).then((landmark) => {
      if (!live) return;
      const next = { ...place, landmark, terrainChecked: true };
      setPlace(next);
      const saved = readLast();
      if (saved?.kind === "place" && saved.place.id === place.id) saveLast({ ...saved, place: next });
    });
    return () => {
      live = false;
    };
  }, [place]);

  const pick = (p: Place) => {
    setPlace(p);
    saveLast({ kind: "place", place: p, here: usedHere || !!place?.here });
    setSearch(null);
  };

  return (
    <>
      {place ? (
        <ArcHome key={place.id} place={place} now={now} onSearch={() => setSearch({})} onLocate={locate} />
      ) : (
        <Welcome locating={locating} onLocate={locate} onSearch={() => setSearch({})} />
      )}
      {search && <PlaceSearch note={search.note} onPick={pick} onLocate={locate} onClose={() => setSearch(null)} />}
    </>
  );
}

// First open: say why location helps before the browser asks (R2).
function Welcome({ locating, onLocate, onSearch }: { locating: boolean; onLocate: () => void; onSearch: () => void }) {
  const s = sky(1);
  return (
    <main className="hz fixed inset-0 flex flex-col overflow-hidden" style={{ background: gradient(s) }}>
      <Landmark id="none" fill={s.land} className="absolute inset-x-0 bottom-0 h-[30%] w-full" />
      <div className="relative mt-[22vh] px-8 text-white">
        <p className="hz-rise text-sm font-medium tracking-wide text-white/75">Horizon</p>
        <h1 className="hz-rise mt-3 text-4xl font-light leading-tight tracking-[-0.02em] text-balance" style={{ ["--i" as string]: 1 }}>
          How long until sunset?
        </h1>
        <p className="hz-rise mt-4 max-w-[30ch] text-white/80 text-pretty" style={{ ["--i" as string]: 2 }}>
          Share your location to see the next sunrise or sunset where you are.
        </p>
        <div className="hz-rise mt-8 flex flex-col items-start gap-2" style={{ ["--i" as string]: 3 }}>
          <button
            onClick={onLocate}
            disabled={locating}
            aria-busy={locating}
            className="h-12 rounded-full bg-white px-6 font-medium text-[#1c2350] transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-80"
          >
            {locating ? "Finding you…" : "Use my location"}
          </button>
          <button onClick={onSearch} className="h-12 rounded-full px-2 font-medium text-white/85 transition-transform duration-150 ease-out active:scale-[0.97]">
            Search a place
          </button>
        </div>
      </div>
    </main>
  );
}
