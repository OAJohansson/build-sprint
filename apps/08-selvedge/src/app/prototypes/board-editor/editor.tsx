"use client";

// The merged editor: Workbench's saves tray on the left, the tools by the picked piece (from
// Desk and Gallery). One layout, several personalities: the theme swaps a class, themes.css
// does the rest. Round 3 (critic round 1): no help text, tools below the piece, the tray as a
// pile of photos at their own shapes, "Start again" at the end of the tray.

import { BoardCanvas, SAVES, SaveThumb, useBoard, useTools, type Rect } from "./engine";

export type Theme = "pencil" | "sketchbook" | "workwear" | "cutpaper";

const TRAY_TITLE: Record<Theme, string> = { pencil: "Your saves", sketchbook: "Saved", workwear: "Your saves", cutpaper: "Your saves" };

export default function Editor({ theme }: { theme: Theme }) {
  const board = useBoard();
  const tools = useTools(board);
  const p = board.piece;
  const topAligned = theme === "cutpaper";

  // Below the piece when there's room, so the tools don't cover what sits above it.
  const chip = (r: Rect, box: { w: number; h: number }) => {
    const below = r.top + r.height + 60 < box.h;
    return (
      <div key={p?.id} className="ed-chip desk-chip absolute z-50 flex items-center gap-1" data-below={below ? "" : undefined}
        style={{ left: r.left + r.width / 2, top: below ? r.top + r.height + 14 : Math.max(8, r.top - 52), transform: "translateX(-50%)" }}
        onPointerDown={(e) => e.stopPropagation()}>
        {tools.map((t) => (
          <button key={t.key} onClick={t.on} className="ed-btn ed-tool" data-active={t.active ? "" : undefined} data-danger={t.key === "delete" ? "" : undefined}>
            <span>{t.label}</span>
          </button>
        ))}
        {board.cropping && p && (
          <input aria-label="Zoom" type="range" min={1} max={3} step={0.05} value={p.zoom} className="ed-zoom mx-2 w-24"
            onChange={(e) => board.actions.zoom(Number(e.target.value))} />
        )}
      </div>
    );
  };

  const count = board.pieces.filter((x) => x.kind === "photo").length;

  return (
    <div className={`ed t-${theme} grid h-dvh grid-cols-[264px_1fr] grid-rows-[64px_1fr]`}>
      {/* The sketchy line: a little noise bends every border drawn with it. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="pencil-line"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="3.2" /></filter>
        <filter id="wash-edge"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="9" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter>
      </svg>

      <header className="ed-top col-span-2 flex items-center gap-6 px-6">
        <span className="ed-logo">Selvedge</span>
        <nav className="ed-tabs flex items-center gap-2 self-stretch">
          {board.boards.map((b) => (
            <button key={b} onClick={() => board.actions.switchBoard(b)} className="ed-btn ed-tab" data-active={b === board.current ? "" : undefined}><span>{b}</span></button>
          ))}
          <button onClick={board.actions.newBoard} className="ed-btn ed-tab ed-quiet" aria-label="New board"><span>+ New</span></button>
        </nav>
      </header>

      <aside className="ed-tray overflow-y-auto p-4">
        <p className="ed-tray-title mb-4">{TRAY_TITLE[theme]}</p>
        <div className="ed-grid">
          {SAVES.map((s, i) => (
            <SaveThumb key={s.id} save={s} board={board} className="ed-thumb"
              style={{ ["--tilt" as string]: `${((i * 37) % 5) - 2}deg`, ["--ar" as string]: String(s.aspect) }} />
          ))}
        </div>
        <button className="ed-btn ed-quiet ed-again mt-4" onClick={board.actions.redraft}><span>Start again from a draft</span></button>
      </aside>

      <main className={`ed-stage relative flex flex-col ${topAligned ? "px-10 pt-8" : "p-8"}`}>
        <BoardCanvas board={board} chrome={chip} fit={topAligned ? "width" : "contain"}
          className={topAligned ? "w-full aspect-[16/9]" : "h-full w-full"} />
        <p className="ed-caption mt-3">{board.current}, {count} pieces</p>
      </main>
    </div>
  );
}
