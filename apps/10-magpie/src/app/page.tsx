"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { FilterControls } from "@/components/filter-controls";
import { Gate } from "@/components/gate";
import { Maggie } from "@/components/maggie";
import { Hearts, Sticker } from "@/components/sticker";
import { putYum, setLastRemoved, useBook, useLastRemoved } from "@/lib/book";
import { activeChips, resultsLine, showLabel } from "@/lib/results";
import { applyFilters, filtersFromParams, filtersToParams, homeCity, isFiltered, maggieLine, NO_FILTERS, smartShelves, type Filters } from "@/lib/shelves";
import type { Yum } from "@/lib/yum";

// Home (designs C, H, I, J and L): the smart shelves, or the empty book, or search and filter
// results when the URL has any. Phone: search on top and a Filter sheet. Laptop (≥1024 px): the
// filter panel is always open on the left (R7, R8, R9, R11, R12).

export default function Home() {
  return (
    <Gate>
      <Suspense>
        <Book />
      </Suspense>
    </Gate>
  );
}

function Book() {
  const { yums } = useBook();
  const router = useRouter();
  const params = useSearchParams();
  const f = filtersFromParams(params);
  const [sheet, setSheet] = useState(false);
  const home = useMemo(() => homeCity(yums), [yums]);
  const filtered = isFiltered(f);
  const results = useMemo(() => (filtered ? applyFilters(yums, f) : []), [yums, filtered, f]);

  const go = (next: Filters) => {
    const qs = filtersToParams(next);
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  if (!yums.length) return <Empty />;

  return (
    <div id="book" className="flex flex-1 lg:flex-row">
      {/* L: the always-open filter panel. */}
      <aside className="hidden w-[290px] flex-none flex-col gap-[18px] border-r-[2.5px] border-cocoa px-6 py-7 lg:flex lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <Link href="/" className="text-[32px] font-semibold leading-none">magpie</Link>
        <FilterControls f={f} set={go} home={home} compact />
        <div className="flex-1" />
        <div className="flex items-end gap-1.5">
          <Maggie pose="sit" size={64} />
          <p className="bubble mb-3 flex-1 text-[13px]">{yums.length} {yums.length === 1 ? "yum" : "yums"}. {maggieLine(yums).replace("I sorted your shelves. ", "")}</p>
        </div>
        <Link href="/new" className="btn btn-primary h-[54px] text-[17px]">Add a yum</Link>
      </aside>

      <main className="mx-auto flex w-full min-w-0 max-w-[440px] flex-1 flex-col gap-[14px] px-5 pb-28 pt-[max(20px,env(safe-area-inset-top))] lg:max-w-none lg:gap-[22px] lg:px-9 lg:pb-10 lg:pt-7">
        {!filtered && (
          <>
            <header className="flex items-center justify-between lg:hidden">
              <h1 className="text-[28px] font-semibold">magpie</h1>
              <span className="flex h-8 items-center rounded-full border-[2.5px] border-cocoa bg-white px-3 text-[14px]">{yums.length} {yums.length === 1 ? "yum" : "yums"}</span>
            </header>
            <div className="flex items-end gap-2 lg:hidden">
              <Maggie pose="sit" size={64} />
              <p className="bubble mb-3 flex-1 text-[14px]">{maggieLine(yums)}</p>
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          {filtered && (
            <button type="button" aria-label="Back to the shelves" onClick={() => go(NO_FILTERS)} className="btn btn-round h-12 w-12 lg:hidden">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
          )}
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full border-[2.5px] border-cocoa bg-white px-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-teal lg:h-[52px] lg:px-[18px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="2.4" aria-hidden="true" className="flex-none"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            <input
              type="search" aria-label="Find a sticker" placeholder="Name, restaurant or note" value={f.q}
              onChange={(e) => go({ ...f, q: e.target.value })}
              enterKeyHint="search" autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[16px] placeholder:text-dusk focus-visible:outline-none lg:text-[17px] [&::-webkit-search-cancel-button]:hidden"
            />
            {f.q && (
              <button type="button" aria-label="Clear search" onClick={() => go({ ...f, q: "" })} className="-mr-2 flex h-10 w-10 flex-none items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="3" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            )}
          </label>
          {!filtered && (
            <button type="button" onClick={() => setSheet(true)} className="btn h-12 flex-none bg-butter px-4 text-[15px] font-normal lg:hidden">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="2.4" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
              Filter
            </button>
          )}
        </div>

        {filtered ? <Results f={f} results={results} home={home} go={go} openSheet={() => setSheet(true)} /> : <Shelves yums={yums} go={go} />}
      </main>

      {!filtered && (
        <Link href="/new" className="btn btn-primary fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 shadow-[0_6px_0_rgba(59,31,26,0.12)] active:-translate-x-1/2 lg:hidden">
          <CameraIcon />Snap a yum
        </Link>
      )}
      {sheet && <FilterSheet yums={yums} initial={f} home={home} onClose={() => setSheet(false)} onApply={(next) => { setSheet(false); go(next); }} />}
      <UndoToast />
    </div>
  );
}

const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
);

function Shelves({ yums, go }: { yums: Yum[]; go: (f: Filters) => void }) {
  const shelves = useMemo(() => smartShelves(yums), [yums]);
  return (
    <>
      {shelves.map((s) => (
        <section key={s.id} className="flex flex-col gap-2 lg:gap-2.5" aria-labelledby={`shelf-${s.id}`}>
          <div className="flex items-baseline justify-between">
            <h2 id={`shelf-${s.id}`} className="min-w-0 break-words text-[18px] font-semibold lg:text-[21px]">{s.title}</h2>
            {s.id === "latest" ? (
              <button type="button" onClick={() => go({ ...NO_FILTERS, all: true })} className="-my-3 min-h-11 flex-none px-1 text-[14px] text-link active:opacity-60">{s.aside}</button>
            ) : (
              <button type="button" onClick={() => go(s.seeAll)} className="-my-3 min-h-11 flex-none px-1 text-[14px] text-dusk active:opacity-60">{s.aside}</button>
            )}
          </div>
          <ul className="no-scrollbar -mx-5 flex snap-x scroll-px-5 overscroll-x-contain gap-2.5 overflow-x-auto px-5 pb-1 pt-1 lg:mx-0 lg:scroll-px-0 lg:gap-[18px] lg:px-0">
            {s.yums.map((y) => (
              <li key={y.id} className="flex-none snap-start">
                <Link href={`/yum/${y.id}`} className="flex w-20 flex-col items-center gap-1 text-center transition-transform active:scale-[0.97] lg:w-[110px]">
                  <span className="lg:hidden"><Sticker yum={y} size={76} /></span>
                  <span className="hidden lg:block"><Sticker yum={y} size={100} /></span>
                  <span className="line-clamp-2 w-full break-words text-[12px] leading-snug lg:text-[14px]">{y.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function Results({ f, results, home, go, openSheet }: { f: Filters; results: Yum[]; home: string | null; go: (f: Filters) => void; openSheet: () => void }) {
  const chips = activeChips(f, home);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 lg:hidden">
        {chips.map((c) => (
          <button key={c.aria} type="button" aria-label={c.aria} onClick={() => go(c.without)} className="chip chip-small h-9 max-w-full gap-1.5 border-[2.5px] bg-butter px-3">
            <span className="truncate">{c.label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="3" aria-hidden="true" className="flex-none"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        ))}
        <button type="button" onClick={openSheet} className="chip chip-small h-9 border-[2.5px] px-3">{chips.length ? "Edit" : "Filter"}</button>
      </div>
      <div className="flex items-center gap-2">
        <Maggie pose="head" size={40} />
        <p className="min-w-0 break-words text-[16px]" role="status">{resultsLine(f, results.length, home)}</p>
        {isFiltered({ ...f, q: "" }) && (
          <button type="button" onClick={() => go(NO_FILTERS)} className="ml-auto hidden min-h-11 px-1 text-[14px] text-link lg:block">Clear</button>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:gap-4">
        {results.map((y) => (
          <li key={y.id}>
            <Link href={`/yum/${y.id}`} className="card flex h-full flex-col items-center gap-1 p-3 text-center transition-transform active:scale-[0.98]">
              <Sticker yum={y} size={84} />
              <span className="mt-1 line-clamp-2 break-words text-[15px] font-medium leading-tight">{y.name}</span>
              {y.place && <span title={y.place} className="w-full truncate text-[12px] text-bark">{y.place}</span>}
              <Hearts n={y.hearts} size={12} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function FilterSheet({ yums, initial, home, onClose, onApply }: { yums: Yum[]; initial: Filters; home: string | null; onClose: () => void; onApply: (f: Filters) => void }) {
  const [f, setF] = useState<Filters>({ ...initial, all: false });
  const n = applyFilters(yums, f).length;
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // A real dialog: focus moves in, the page behind is inert, focus returns on close.
    const opener = document.activeElement as HTMLElement | null;
    const behind = [...document.querySelectorAll<HTMLElement>("#book > aside, #book > main, #book > a")];
    title.current?.focus();
    behind.forEach((el) => el.setAttribute("inert", ""));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
      behind.forEach((el) => el.removeAttribute("inert"));
      opener?.focus();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <button type="button" aria-label="Close" className="shade absolute inset-0 bg-[#3B1F1A]/45" onClick={onClose} />
      <div className="sheet relative mx-auto flex max-h-[92dvh] w-full max-w-[440px] flex-col gap-4 overflow-y-auto overscroll-contain rounded-t-[28px] border-t-[2.5px] border-cocoa bg-cream px-5 pt-3 safe-bottom">
        <span className="h-[5px] w-11 self-center rounded-full bg-[#C9A98F]" />
        <div className="flex items-center justify-between">
          <h2 id="sheet-title" tabIndex={-1} ref={title} className="text-[22px] font-semibold outline-none">What are you after?</h2>
          <button type="button" onClick={() => setF({ ...NO_FILTERS, q: f.q })} className="min-h-11 px-1 text-[15px] text-link active:opacity-60">Clear</button>
        </div>
        <FilterControls f={f} set={setF} home={home} />
        <button type="button" onClick={() => onApply(f)} className="btn btn-primary h-14 w-full" disabled={n === 0}>
          {showLabel(f, n)}
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[440px] flex-1 flex-col gap-[14px] px-5 pb-28 pt-[max(20px,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <h1 className="text-[28px] font-semibold">magpie</h1>
        <span className="flex h-8 items-center rounded-full border-[2.5px] border-cocoa bg-white px-3 text-[14px]">0 yums</span>
      </header>
      <div className="card mt-2.5 grid grid-cols-3 gap-x-2 gap-y-3.5 px-3 py-[18px]" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-[86px] border-[2.5px] border-dashed border-dash ${i % 2 ? "rounded-[18px]" : "rounded-full"}`} />
        ))}
      </div>
      <div className="mt-2.5 flex items-end gap-2">
        <Maggie pose="sit" size={110} />
        <p className="bubble mb-[22px] flex-1 rounded-[18px_18px_18px_4px] px-3.5 py-3 text-[16px] leading-[1.4]">My book is empty and I&apos;m a little peckish. Tasted something good lately?</p>
      </div>
      <p className="text-center text-[14px] leading-normal text-dusk">Tip: share a photo from your camera roll or Instagram straight into Magpie.</p>
      <Link href="/new" className="btn btn-primary fixed bottom-[max(26px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 active:-translate-x-1/2">
        <CameraIcon />Snap your first yum
      </Link>
    </main>
  );
}

/** After "Remove from my book": the way back (R10). */
function UndoToast() {
  const removed = useLastRemoved();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!removed) return;
    // 8 s of the page being seen; the clock stops while the tab is hidden.
    let left = 8000, started = Date.now(), t: ReturnType<typeof setTimeout> | undefined;
    const run = () => { started = Date.now(); t = setTimeout(() => setLastRemoved(null), left); };
    const vis = () => { if (document.hidden) { clearTimeout(t); left -= Date.now() - started; } else run(); };
    run();
    document.addEventListener("visibilitychange", vis);
    return () => { clearTimeout(t); document.removeEventListener("visibilitychange", vis); };
  }, [removed]);
  if (!removed) return null;
  async function undo() {
    const y = removed!;
    setLastRemoved(null);
    const r = await fetch(`/api/yums/${y.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removed: false }) }).catch(() => null);
    if (r?.ok) { setFailed(false); putYum(((await r.json()) as { yum: Yum }).yum); }
    else { setFailed(true); setLastRemoved(y); }
  }
  return (
    <div role="status" className="fixed inset-x-0 bottom-[max(100px,calc(env(safe-area-inset-bottom)+80px))] z-30 mx-auto flex w-[calc(100%-40px)] max-w-[400px] items-center gap-3 rounded-2xl border-[2.5px] border-cocoa bg-cocoa px-4 py-2 text-cream lg:bottom-8">
      <span className="min-w-0 flex-1 truncate text-[15px]">{failed ? "Couldn\u2019t reach your book. Try again?" : `Removed ${removed.name}.`}</span>
      <button type="button" onClick={undo} className="min-h-11 flex-none px-2 text-[15px] font-medium text-butter active:opacity-60">Undo</button>
    </div>
  );
}
