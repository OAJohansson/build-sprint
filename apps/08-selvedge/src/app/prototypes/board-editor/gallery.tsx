"use client";

// Gallery: the board is the whole screen. No chrome until you pick a piece (a small bar appears
// above it) or ask for your saves (a sheet slides up). Content first: the board looks finished
// even while you edit it.

import { useState } from "react";
import { BoardCanvas, SAVES, SaveThumb, useBoard, useTools, type Rect } from "./engine";

export default function Gallery() {
  const board = useBoard();
  const tools = useTools(board);
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const p = board.piece;

  const bar = (r: Rect) => (
    <div key={p?.id} className="gallery-bar absolute z-50 flex items-center gap-0.5 rounded-lg bg-white/95 p-1 text-[#1b1c1e] shadow-[0_4px_16px_rgba(0,0,0,.18)]"
      style={{ left: r.left, top: Math.max(8, r.top - 46) }} onPointerDown={(e) => e.stopPropagation()}>
      {tools.map((t) => (
        <button key={t.key} onClick={t.on}
          className={`h-8 whitespace-nowrap rounded-md px-2.5 text-[13px] transition-colors duration-150 ease-out active:scale-[0.97] ${t.active ? "bg-[#1b1c1e] text-white" : "hover:bg-black/5"}`}>
          {t.label}
        </button>
      ))}
      {board.cropping && p && (
        <input aria-label="Zoom" type="range" min={1} max={3} step={0.05} value={p.zoom} className="mx-2 w-24"
          onChange={(e) => board.actions.zoom(Number(e.target.value))} />
      )}
    </div>
  );

  return (
    <div className="relative h-dvh overflow-hidden bg-[#f7f3ea]">
      <BoardCanvas board={board} chrome={bar} className="h-full w-full" />

      <div className="absolute right-5 top-5 z-[60]">
        <button onClick={() => setMenu((m) => !m)} className="h-9 rounded-full bg-white/90 px-4 text-[13px] font-medium text-[#1b1c1e] shadow-md transition-transform duration-150 ease-out active:scale-[0.97]">
          {board.current}
        </button>
        {menu && (
          <div className="gallery-pop absolute right-0 mt-2 w-48 rounded-lg bg-white p-1 text-[13px] text-[#1b1c1e] shadow-lg">
            {board.boards.map((b) => <button key={b} onClick={() => { board.actions.switchBoard(b); setMenu(false); }} className="block w-full rounded-md px-3 py-2 text-left hover:bg-black/5">{b}</button>)}
            <button onClick={() => { board.actions.newBoard(); setMenu(false); }} className="block w-full rounded-md px-3 py-2 text-left text-black/60 hover:bg-black/5">+ New board</button>
            <button onClick={() => { board.actions.redraft(); setMenu(false); }} className="block w-full rounded-md px-3 py-2 text-left text-black/60 hover:bg-black/5">Start again from a draft</button>
          </div>
        )}
      </div>

      <button onClick={() => setSheet(true)} className="absolute bottom-5 right-5 z-[60] h-10 rounded-full bg-[#1b1c1e] px-5 text-[13px] font-medium text-white shadow-lg transition-transform duration-150 ease-out active:scale-[0.97]">
        Your saves
      </button>

      <div className={`gallery-sheet absolute inset-x-0 bottom-0 z-[70] rounded-t-2xl bg-white p-5 shadow-[0_-8px_30px_rgba(0,0,0,.18)] ${sheet ? "open" : ""}`} aria-hidden={!sheet}>
        <div className="mb-3 flex items-center justify-between text-[13px] text-[#1b1c1e]">
          <span className="font-medium">Your saves · click or drag onto the board</span>
          <button onClick={() => setSheet(false)} className="rounded-md px-3 py-1.5 hover:bg-black/5">Close</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SAVES.map((s) => <SaveThumb key={s.id} save={s} board={board} className="h-[150px] w-[108px] rounded-md transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97]" />)}
        </div>
      </div>
    </div>
  );
}
