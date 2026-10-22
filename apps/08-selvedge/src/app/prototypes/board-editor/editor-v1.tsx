"use client";

// Sketchbook V1: the owner's pick, exactly as it was in round 2 (restored from c0195e6 at the
// owner's request, 22 Oct). Kept apart from editor.tsx so later rounds can't change it.

import { useMemo } from "react";
import { BoardCanvas, SAVES, SaveThumb, useBoard, type Board, type Rect } from "./engine";

// Round 2's tools: Forward and Back as two buttons, Delete.
function useTools(board: Board) {
  const p = board.piece;
  return useMemo(() => p ? [
    ...(p.kind === "photo" ? [{ key: "crop", label: board.cropping ? "Done cropping" : "Crop", on: board.actions.toggleCrop, active: board.cropping }] : []),
    { key: "rough", label: "Rough edge", on: board.actions.toggleRough, active: p.rough },
    { key: "forward", label: "Forward", on: board.actions.forward, active: false },
    { key: "back", label: "Back", on: board.actions.back, active: false },
    { key: "delete", label: "Delete", on: board.actions.remove, active: false },
  ] : [], [p, board.cropping, board.actions]);
}

export default function SketchbookV1() {
  const board = useBoard();
  const tools = useTools(board);
  const p = board.piece;

  const chip = (r: Rect) => (
    <div key={p?.id} className="ed-chip desk-chip absolute z-50 flex items-center gap-1"
      style={{ left: r.left + r.width / 2, top: Math.max(8, r.top - 52), transform: "translateX(-50%)" }}
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

  return (
    <div className={`ed t-sketchbook1 grid h-dvh grid-cols-[264px_1fr] grid-rows-[64px_1fr]`}>
      {/* The sketchy line: a little noise bends every border drawn with it. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="pencil-line"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="3.2" /></filter>
        <filter id="wash-edge"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="9" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter>
      </svg>

      <header className="ed-top col-span-2 flex items-center gap-5 px-6">
        <span className="ed-logo">Selvedge</span>
        <nav className="flex items-center gap-1">
          {board.boards.map((b) => (
            <button key={b} onClick={() => board.actions.switchBoard(b)} className="ed-btn ed-tab" data-active={b === board.current ? "" : undefined}><span>{b}</span></button>
          ))}
          <button onClick={board.actions.newBoard} className="ed-btn ed-tab ed-quiet"><span>+ New board</span></button>
        </nav>
        <span className="ed-hint ml-auto">{p ? (board.cropping ? "Drag the photo to move it in its frame" : "Drag to move · corner to resize") : "Click a piece to edit it"}</span>
        <button className="ed-btn ed-quiet" onClick={board.actions.redraft}><span>Start again from a draft</span></button>
      </header>

      <aside className="ed-tray overflow-y-auto p-4">
        <p className="ed-tray-title mb-3">Your saves</p>
        <div className="grid grid-cols-2 gap-3">
          {SAVES.map((s, i) => <SaveThumb key={s.id} save={s} board={board} className="ed-thumb aspect-[3/4]" style={{ ["--tilt" as string]: `${((i * 37) % 5) - 2}deg` }} />)}
        </div>
        <p className="ed-tray-foot mt-4">Click a save, or drag it onto the board</p>
      </aside>

      <main className="ed-stage relative p-8">
        <BoardCanvas board={board} chrome={chip} className="h-full w-full" />
      </main>
    </div>
  );
}
