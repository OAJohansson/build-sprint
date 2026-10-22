"use client";

// Workbench: the tools are always on screen. Saves in a tray on the left, a tool bar on top, the
// board in the middle. Like Canva or Figma: nothing to discover, everything to see.

import { BoardCanvas, SAVES, SaveThumb, useBoard, useTools } from "./engine";

export default function Workbench() {
  const board = useBoard();
  const tools = useTools(board);
  const p = board.piece;

  return (
    <div className="grid h-dvh grid-cols-[260px_1fr] grid-rows-[56px_1fr] bg-[#ecebe7] text-[#1b1c1e]">
      <header className="col-span-2 flex items-center gap-3 border-b border-black/10 bg-white px-4">
        <span className="mr-2 text-[15px] font-semibold tracking-tight">Selvedge</span>
        <select value={board.current} onChange={(e) => board.actions.switchBoard(e.target.value)}
          className="h-8 rounded-md border border-black/15 bg-white px-2 text-[13px]">
          {board.boards.map((b) => <option key={b}>{b}</option>)}
        </select>
        <button className="h-8 rounded-md px-2 text-[13px] text-black/60 hover:bg-black/5" onClick={board.actions.newBoard}>New board</button>
        <span className="mx-2 h-5 w-px bg-black/10" />
        {p ? tools.map((t) => (
          <button key={t.key} onClick={t.on}
            className={`h-8 rounded-md px-3 text-[13px] transition-colors duration-150 ease-out active:scale-[0.97] ${t.active ? "bg-[#1b1c1e] text-white" : "hover:bg-black/5"} ${t.key === "delete" ? "text-[#b4321f]" : ""}`}>
            {t.label}
          </button>
        )) : <span className="text-[13px] text-black/45">Pick a piece to crop, layer or give it a rough edge</span>}
        {p && board.cropping && (
          <label className="ml-2 flex items-center gap-2 text-[13px] text-black/60">Zoom
            <input type="range" min={1} max={3} step={0.05} value={p.zoom} onChange={(e) => board.actions.zoom(Number(e.target.value))} />
          </label>
        )}
        <button className="ml-auto h-8 rounded-md px-3 text-[13px] text-black/60 hover:bg-black/5" onClick={board.actions.redraft}>Start again from a draft</button>
      </header>

      <aside className="overflow-y-auto border-r border-black/10 bg-white p-3">
        <p className="mb-2 px-1 text-[12px] font-medium text-black/50">Your saves · click or drag onto the board</p>
        <div className="grid grid-cols-2 gap-2">
          {SAVES.map((s) => <SaveThumb key={s.id} save={s} board={board} className="aspect-[3/4] rounded-md transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97]" />)}
        </div>
      </aside>

      <main className="relative p-8">
        <BoardCanvas board={board} className="h-full w-full" />
      </main>
    </div>
  );
}
