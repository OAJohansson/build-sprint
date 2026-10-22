"use client";

// Desk: the board lies on a desk, the saves are a strip of prints along the bottom, and the tools
// float next to whatever you've picked up. Object first: you touch the piece, its tools come to you.

import { BoardCanvas, SAVES, SaveThumb, useBoard, useTools, type Rect } from "./engine";

export default function Desk() {
  const board = useBoard();
  const tools = useTools(board);
  const p = board.piece;

  const chip = (r: Rect) => (
    <div key={p?.id} className="desk-chip absolute z-50 flex items-center gap-1 rounded-full bg-[#1b1c1e] p-1 shadow-lg"
      style={{ left: r.left + r.width / 2, top: Math.max(8, r.top - 48), transform: "translateX(-50%)" }}
      onPointerDown={(e) => e.stopPropagation()}>
      {tools.map((t) => (
        <button key={t.key} onClick={t.on}
          className={`h-8 whitespace-nowrap rounded-full px-3 text-[13px] transition-colors duration-150 ease-out active:scale-[0.97] ${t.active ? "bg-white text-[#1b1c1e]" : "text-white/80 hover:bg-white/10"}`}>
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
    <div className="flex h-dvh flex-col bg-[#b9a487]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "6px 6px" }}>
      <div className="flex items-center gap-5 px-10 pt-6 text-[14px] text-[#2b1f14]">
        {board.boards.map((b) => (
          <button key={b} onClick={() => board.actions.switchBoard(b)}
            className={`pb-1 transition-colors duration-150 ease-out ${b === board.current ? "border-b-2 border-[#2b1f14] font-medium" : "text-[#2b1f14]/60 hover:text-[#2b1f14]"}`}>{b}</button>
        ))}
        <button onClick={board.actions.newBoard} className="pb-1 text-[#2b1f14]/60 hover:text-[#2b1f14]">+ New board</button>
        <button onClick={board.actions.redraft} className="ml-auto pb-1 text-[#2b1f14]/60 hover:text-[#2b1f14]">Start again from a draft</button>
      </div>

      <div className="relative flex-1 px-10 py-6">
        <BoardCanvas board={board} chrome={chip} className="h-full w-full" style={{ filter: "drop-shadow(0 14px 22px rgba(43,31,20,.35))" }} />
      </div>

      <div className="flex h-[150px] items-end gap-3 overflow-x-auto px-10 pb-5">
        {SAVES.map((s, i) => (
          <SaveThumb key={s.id} save={s} board={board}
            className="h-[118px] w-[84px] border-[5px] border-white shadow-md transition-transform duration-150 ease-out hover:-translate-y-1.5 active:scale-[0.97]"
            style={{ rotate: `${((i * 37) % 7) - 3}deg` }} />
        ))}
      </div>
    </div>
  );
}
