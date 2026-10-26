"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cardModel, dayParts, type CardModel } from "@/lib/card";
import { copy, titleCase } from "@/lib/copy";
import type { Habit, SlipSize } from "@/lib/habits";
import { weekStrip } from "@/lib/progress";
import { peekState, useWont } from "@/lib/store";
import { useSyncStatus } from "@/lib/sync-client";
import { RideOut } from "./ride-out";
import { Sheet } from "./sheet";
import { Steamer } from "./wonton";

// The board (Wontons v3 + L25): title and week strip in ink on the cream board, one big card per
// habit. The card is the tap target (R4); a stop card has Slipped and Had an urge (R5).
export function Board() {
  const w = useWont();
  const router = useRouter();
  const { state, today } = w;
  const sync = useSyncStatus();
  const [fresh, setFresh] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [slipFor, setSlipFor] = useState<string | null>(null);
  const [ridingFor, setRidingFor] = useState<string | null>(null);
  // Feedback 34: "ridden out" only once the 60 s pause ran to the end (this visit only).
  const [riddenOut, setRiddenOut] = useState<string | null>(null);

  // R1: first launch goes to the intro. Read storage directly so a ?seed= applied by useWont's
  // effect just before this one is already counted.
  useEffect(() => {
    if (!peekState().introSeen) router.replace("/intro");
  }, [router]);

  const habits = [...state.habits].sort((a, b) => a.order - b.order);
  const models: [Habit, CardModel][] = today
    ? habits.map((h) => [h, cardModel(h, state.logs[h.id], today, state.comebacksSeen[h.id])])
    : [];

  // L14 (feedback 37): a comeback line shows for this whole visit, then counts as seen once the
  // app is closed or put away: not again that day, but again on a later day if the run grew.
  const dueKey = models
    .filter(([, m]) => m.comeback && !m.keptToday)
    .map(([h, m]) => `${h.id}=${m.comeback!.id}`)
    .join(",");
  const markRef = useRef(w.markComebackSeen);
  useEffect(() => {
    markRef.current = w.markComebackSeen;
  });
  useEffect(() => {
    if (!dueKey) return;
    const flush = (e: Event) => {
      if (e.type === "visibilitychange" && document.visibilityState === "visible") return;
      for (const pair of dueKey.split(",")) {
        const [id, day] = pair.split("=");
        markRef.current(id, day);
      }
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [dueKey]);

  const closeAdd = useCallback(() => setAddOpen(false), []);
  const closeSlip = useCallback(() => setSlipFor(null), []);
  const endRide = useCallback(() => setRidingFor(null), []);
  const rodeOut = useCallback(() => {
    setRiddenOut(ridingFor);
    setRidingFor(null);
  }, [ridingFor]);

  if (!today || !state.introSeen) return <main className="w" />;

  const { weekday } = dayParts(today);
  const week = weekStrip(state.habits, state.logs, today);
  const slipHabit = habits.find((h) => h.id === slipFor);
  const slipModel = models.find(([h]) => h.id === slipFor)?.[1];
  const rideHabit = habits.find((h) => h.id === ridingFor);

  const tap = (h: Habit, m: CardModel) => {
    if (h.kind === "stop" && m.slipSize) return setSlipFor(h.id);
    setFresh(m.keptToday ? null : h.id);
    w.toggleKept(h.id);
  };

  return (
    <main className="w">
      <header className="w-head">
        <div className="w-top">
          <h1>{copy.days.weekday(weekday)}</h1>
          <button type="button" className="w-add" aria-label={copy.board.add} onClick={() => setAddOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {habits.length > 0 && (
          <div className="w-week" role="group" aria-label={copy.board.weekLabel}>
            {week.map((d) => {
              const p = dayParts(d.day);
              return (
                <div key={d.day} className={`w-day ${d.day === today ? "today" : ""}`} aria-current={d.day === today ? "date" : undefined}>
                  <b aria-hidden="true">{copy.days.letter(p.weekday)}</b>
                  <span aria-hidden="true">{p.date}</span>
                  {/* One soft tan dot, filled by the share of habits kept that day (feedback 24). */}
                  <i
                    role="img"
                    style={{ ["--v" as string]: d.share ?? 0 }}
                    aria-label={copy.board.dayKept(copy.days.weekday(p.weekday), d.kept, d.total)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </header>

      <div className="w-cards">
        {habits.length === 0 && (
          <section className="w-empty">
            <Steamer marks={[]} />
            <h2>{copy.board.emptyTitle}</h2>
            <p>{copy.board.emptyBody}</p>
            <Link href="/new" className="w-primary">{copy.board.emptyPrimary}</Link>
            <Link href="/new-stop" className="w-quiet w-quiet-link">{copy.board.emptyStop}</Link>
          </section>
        )}

        {models.map(([h, m]) => (
          <HabitCard
            key={h.id}
            habit={h}
            m={m}
            fresh={fresh === h.id && m.keptToday}
            riddenOut={riddenOut === h.id}
            onTap={() => tap(h, m)}
            onSlip={() => setSlipFor(h.id)}
            onUrge={() => {
              w.logUrge(h.id);
              setRiddenOut(null);
              setRidingFor(h.id);
            }}
          />
        ))}
      </div>

      <footer className="w-foot">
        <Link href="/intro" className="w-foot-link">{copy.board.replayIntro}</Link>
        <Link href="/sync" className="w-foot-link">
          {!sync.connected ? copy.board.syncOff : sync.status === "offline" ? copy.board.syncOffline : copy.board.syncOn}
        </Link>
      </footer>

      <Sheet open={addOpen} onClose={closeAdd} label={copy.board.addSheetTitle}>
        <h2>{copy.board.addSheetTitle}</h2>
        <div className="w-choices">
          <Link href="/new" className="w-choice">
            <b>{copy.board.addBuild}</b>
            <span>{copy.board.addBuildHint}</span>
          </Link>
          <Link href="/new-stop" className="w-choice">
            <b>{copy.board.addStop}</b>
            <span>{copy.board.addStopHint}</span>
          </Link>
        </div>
        <button type="button" className="w-link" onClick={closeAdd}>{copy.board.notNow}</button>
      </Sheet>

      <Sheet open={!!slipHabit} onClose={closeSlip} label={copy.slip.title}>
        <h2>{copy.slip.title}</h2>
        <p>{copy.slip.body}</p>
        <div className="w-sizes">
          {(["1", "2", "3+"] as SlipSize[]).map((s) => (
            <button
              key={s}
              type="button"
              className="w-quiet"
              aria-pressed={slipModel?.slipSize === s}
              aria-label={copy.slip.sizeLabel(s)}
              onClick={() => {
                if (slipHabit) w.logSlip(slipHabit.id, s);
                closeSlip();
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {slipModel?.slipSize && (
          <button
            type="button"
            className="w-link"
            onClick={() => {
              if (slipHabit) w.undoSlip(slipHabit.id);
              closeSlip();
            }}
          >
            {copy.slip.undo}
          </button>
        )}
        <button type="button" className="w-link" onClick={closeSlip}>{copy.slip.notNow}</button>
      </Sheet>

      {rideHabit?.kind === "stop" && <RideOut replacement={rideHabit.replacement} onExit={endRide} onComplete={rodeOut} />}
    </main>
  );
}

function HabitCard({
  habit: h,
  m,
  fresh,
  riddenOut,
  onTap,
  onSlip,
  onUrge,
}: {
  habit: Habit;
  m: CardModel;
  fresh: boolean;
  riddenOut: boolean;
  onTap: () => void;
  onSlip: () => void;
  onUrge: () => void;
}) {
  const cb = m.comeback && !m.keptToday ? m.comeback : null;
  const cbDays = cb ? cb.missed.map((d) => dayParts(d).weekday) : [];
  const comebackLine = !cb
    ? null
    : h.kind === "build"
      ? copy.comeback.build(cbDays)
      : cb.lastKind === "slip"
        ? copy.comeback.stopSlip(cbDays[cbDays.length - 1], m.cleanDays, h.replacement)
        : copy.comeback.stopUnlogged(cbDays);

  let status: string;
  let aria: string;
  if (h.kind === "build") {
    status = m.keptToday ? (m.comebackToday ? copy.card.comeback : copy.card.kept) : copy.card.open;
    aria = copy.card.ariaBuild(h.name, m.keptToday);
  } else {
    status = m.slipSize
      ? copy.card.slipped(m.slipSize, m.cleanDays)
      : m.keptToday
        ? m.comebackToday
          ? `${copy.card.cleanSoFar} · ${copy.card.comeback}`
          : copy.card.cleanSoFar
        : copy.card.tapIfClean;
    if (m.urgesToday > 0) status += copy.card.urges(m.urgesToday, riddenOut);
    aria = m.slipSize ? copy.card.ariaSlipped(h.name) : copy.card.ariaStop(h.name, m.keptToday);
  }

  return (
    <article className={`w-card ${m.keptToday ? "kept" : ""}`}>
      <button type="button" className="w-hit" aria-pressed={m.keptToday} aria-label={aria} onClick={onTap} />
      <Link href={`/habit/${h.id}`} className="w-more" aria-label={copy.board.open(h.name)}>
        <svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true">
          <circle cx="2" cy="2" r="1.6" fill="currentColor" />
          <circle cx="9" cy="2" r="1.6" fill="currentColor" />
          <circle cx="16" cy="2" r="1.6" fill="currentColor" />
        </svg>
      </Link>
      <div className="w-art">
        <Steamer marks={m.marks} fresh={fresh} />
        {h.kind === "stop" && <small className="w-art-cap">{copy.card.pileCaption}</small>}
      </div>
      <div className="w-body">
        <h2 className="w-nm" dir="auto"><bdi>{titleCase(h.name)}</bdi></h2>
        <p className="w-rate">
          {h.kind === "build"
            ? copy.card.rate(m.rate.kept, m.rate.of, m.today === "pending")
            : copy.card.cleanDays(m.cleanDays)}
        </p>
        <p className="w-an">
          {h.kind === "build" ? copy.card.buildLine(h.anchor, h.action, h.goal) : copy.card.stopLine(h.trigger, h.replacement)}
        </p>
        {comebackLine && <p className="w-cb">{comebackLine}</p>}
        <p className="w-st">{status}</p>
        {h.kind === "stop" && m.slipSize && <p className="w-cb">{copy.card.slipNext(h.replacement)}</p>}
        {h.kind === "stop" && (
          <div className="w-quiet-row">
            <button type="button" className="w-quiet" onClick={onSlip}>{copy.card.slipButton}</button>
            <button type="button" className="w-quiet" onClick={onUrge}>{copy.card.urgeButton}</button>
          </div>
        )}
      </div>
    </article>
  );
}
