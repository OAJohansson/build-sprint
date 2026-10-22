"use client";

/* eslint-disable @next/next/no-img-element */
// The board editor's shared engine for the three prototype layouts: the saves, the tiled draft,
// the pieces and every edit (move, resize, crop, layer order, delete, rough edge). The layouts
// only decide where the tools and saves sit.
// shortcut: boards live in memory, wire them to Supabase (decision 0021) when the winner is promoted.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export const BOARD_W = 1600;
export const BOARD_H = 900;

export type Save = { id: string; src: string; aspect: number; source: "Instagram" | "Pinterest" | "Gallery" };
export type Piece = {
  id: string;
  kind: "photo" | "swatch" | "title";
  x: number; y: number; w: number; h: number; z: number;
  src?: string;
  color?: string;
  text?: string;
  cropX: number; cropY: number; zoom: number;
  rough: boolean;
};

// The 18 Summer 2026 saves (width / height of each photo).
const ASPECTS = [432, 437, 614, 452, 439, 580, 542, 432, 384, 434, 614, 432, 432, 462, 508, 432, 432, 612].map((w) => w / 768);
const SOURCES: Save["source"][] = ["Pinterest", "Instagram", "Gallery"];
export const SAVES: Save[] = ASPECTS.map((aspect, i) => ({
  id: `s${i + 1}`,
  src: `/prototype-board/${String(i + 1).padStart(2, "0")}.jpg`,
  aspect,
  source: SOURCES[i % 3],
}));

// The palette, read off the owner's Spring / Summer board.
export const PALETTE = ["#4a2a26", "#f2e3c6", "#e4e6e1", "#5f6b66", "#1f2d4d", "#1b1c1e"];

// Which part of each photo to show when it's tiled (the outfit, not the sky).
const FOCUS: Record<string, [number, number]> = { s1: [50, 30], s4: [50, 45], s5: [40, 45], s6: [50, 45], s8: [50, 40], s11: [50, 50], s13: [50, 40], s16: [50, 40] };

let nextId = 1;
const uid = () => `p${nextId++}`;

// A new board starts like the owner's: photos tiled edge to edge in two rows, palette squares
// laid over the seams, the title pill in the middle.
export function tiledDraft(title: string, saves: Save[]): Piece[] {
  const picked = saves.slice(0, 14);
  const rows = [picked.slice(0, Math.ceil(picked.length / 2)), picked.slice(Math.ceil(picked.length / 2))];
  const pieces: Piece[] = [];
  let z = 1;
  rows.forEach((row, r) => {
    // Wider photos get wider tiles, and every row fills the board exactly.
    const total = row.reduce((s, p) => s + p.aspect, 0);
    let x = 0;
    row.forEach((save, i) => {
      const w = i === row.length - 1 ? BOARD_W - x : Math.round((save.aspect / total) * BOARD_W);
      const [cx, cy] = FOCUS[save.id] ?? [50, 40];
      pieces.push({ id: uid(), kind: "photo", src: save.src, x, y: r * (BOARD_H / 2), w, h: BOARD_H / 2, z: z++, cropX: cx, cropY: cy, zoom: 1, rough: false });
      x += w;
    });
  });
  const spots: [number, number][] = [[300, 90], [60, 370], [1330, 110], [1250, 470], [560, 600], [930, 640]];
  PALETTE.forEach((color, i) => {
    const [x, y] = spots[i];
    pieces.push({ id: uid(), kind: "swatch", color, x, y, w: 150, h: 150, z: z++, cropX: 50, cropY: 50, zoom: 1, rough: false });
  });
  pieces.push({ id: uid(), kind: "title", text: title, x: 380, y: 390, w: 840, h: 120, z: z++, cropX: 50, cropY: 50, zoom: 1, rough: false });
  return pieces;
}

// A ragged "cut from a magazine" edge, the same every time for a given piece.
function roughEdge(id: string) {
  let seed = [...id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) % 2147483647 || 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pts: string[] = [];
  const a = 1.6, step = 2.5;
  for (let x = 0; x <= 100; x += step) pts.push(`${x}% ${rnd() * a}%`);
  for (let y = 0; y <= 100; y += step) pts.push(`${100 - rnd() * a}% ${y}%`);
  for (let x = 100; x >= 0; x -= step) pts.push(`${x}% ${100 - rnd() * a}%`);
  for (let y = 100; y >= 0; y -= step) pts.push(`${rnd() * a}% ${y}%`);
  return `polygon(${pts.join(",")})`;
}

const SEASONS = ["Summer 2026", "Spring 2026"];

export function useBoard() {
  const [boards, setBoards] = useState<Record<string, Piece[]>>(() => ({
    "Summer 2026": tiledDraft("Summer 2026", SAVES),
    "Spring 2026": tiledDraft("Spring 2026", [...SAVES].reverse()),
  }));
  const [current, setCurrent] = useState(SEASONS[0]);
  const [selected, setSelected] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const pieces = boards[current];

  const setPieces = useCallback((fn: (p: Piece[]) => Piece[]) => setBoards((b) => ({ ...b, [current]: fn(b[current]) })), [current]);
  const update = useCallback((id: string, patch: Partial<Piece>) => setPieces((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))), [setPieces]);

  const piece = pieces.find((p) => p.id === selected) ?? null;
  const maxZ = Math.max(0, ...pieces.map((p) => p.z));
  const minZ = Math.min(0, ...pieces.map((p) => p.z));

  const actions = {
    select: (id: string | null) => { setSelected(id); if (!id) setCropping(false); },
    forward: () => piece && update(piece.id, { z: maxZ + 1 }),
    back: () => piece && update(piece.id, { z: minZ - 1 }),
    remove: () => { if (piece) { setPieces((ps) => ps.filter((p) => p.id !== piece.id)); setSelected(null); setCropping(false); } },
    toggleRough: () => piece && update(piece.id, { rough: !piece.rough }),
    toggleCrop: () => piece?.kind === "photo" && setCropping((c) => !c),
    zoom: (z: number) => piece && update(piece.id, { zoom: Math.min(3, Math.max(1, z)) }),
    addSave: (save: Save, at?: { x: number; y: number }) => {
      const h = 420, w = Math.round(h * save.aspect);
      const id = uid();
      setPieces((ps) => [...ps, { id, kind: "photo", src: save.src, x: (at?.x ?? BOARD_W / 2) - w / 2, y: (at?.y ?? BOARD_H / 2) - h / 2, w, h, z: Math.max(0, ...ps.map((p) => p.z)) + 1, cropX: 50, cropY: 40, zoom: 1, rough: false }]);
      setSelected(id);
    },
    newBoard: () => {
      const name = `Autumn 2026${boards["Autumn 2026"] ? " (2)" : ""}`;
      setBoards((b) => ({ ...b, [name]: tiledDraft(name, SAVES.slice(4)) }));
      setCurrent(name); setSelected(null);
    },
    redraft: () => { setPieces(() => tiledDraft(current, current === "Spring 2026" ? [...SAVES].reverse() : SAVES)); setSelected(null); },
    switchBoard: (name: string) => { setCurrent(name); setSelected(null); setCropping(false); },
  };

  // Keyboard: Delete removes, Escape lets go, [ and ] change the layer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)) return;
      if (!piece) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); actions.remove(); }
      else if (e.key === "Escape") actions.select(null);
      else if (e.key === "]") actions.forward();
      else if (e.key === "[") actions.back();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  return { boards: Object.keys(boards), current, pieces, piece, selected, cropping, update, actions };
}

export type Board = ReturnType<typeof useBoard>;
export type Rect = { left: number; top: number; width: number; height: number };

// The board itself: scales 1600 x 900 into its box and handles the pointer work. `chrome` draws
// a layout's tools next to the selected piece, given that piece's box in screen pixels.
export function BoardCanvas({ board, fit = "contain", chrome, className = "", style }: {
  board: Board;
  fit?: "contain" | "width";
  chrome?: (rect: Rect) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = fit === "width" ? size.w / BOARD_W : Math.min(size.w / BOARD_W, size.h / BOARD_H) || 0;
  const offX = (size.w - BOARD_W * s) / 2, offY = fit === "width" ? 0 : (size.h - BOARD_H * s) / 2;

  const { pieces, selected, cropping, update, actions } = board;
  const drag = useRef<{ id: string; mode: "move" | "resize" | "crop"; sx: number; sy: number; start: Piece } | null>(null);

  const onDown = (e: React.PointerEvent, p: Piece, mode: "move" | "resize") => {
    e.stopPropagation();
    actions.select(p.id);
    const m = cropping && selected === p.id && mode === "move" ? "crop" : mode;
    drag.current = { id: p.id, mode: m, sx: e.clientX, sy: e.clientY, start: p };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !s) return;
    const dx = (e.clientX - d.sx) / s, dy = (e.clientY - d.sy) / s, p = d.start;
    if (d.mode === "move") update(d.id, { x: Math.round(p.x + dx), y: Math.round(p.y + dy) });
    else if (d.mode === "resize") update(d.id, { w: Math.max(40, Math.round(p.w + dx)), h: Math.max(40, Math.round(p.h + dy)) });
    else update(d.id, { cropX: clamp(p.cropX - (dx / p.w) * 100 / p.zoom), cropY: clamp(p.cropY - (dy / p.h) * 100 / p.zoom) });
  };
  const onUp = () => { drag.current = null; };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const save = SAVES.find((x) => x.id === e.dataTransfer.getData("text/selvedge-save"));
    const r = box.current!.getBoundingClientRect();
    if (save) actions.addSave(save, { x: (e.clientX - r.left - offX) / s, y: (e.clientY - r.top - offY) / s });
  };

  const sel = pieces.find((p) => p.id === selected);
  const rect: Rect | null = sel ? { left: offX + sel.x * s, top: offY + sel.y * s, width: sel.w * s, height: sel.h * s } : null;

  return (
    <div ref={box} className={`relative select-none ${className}`} style={style}
      onPointerDown={() => actions.select(null)} onPointerMove={onMove} onPointerUp={onUp}
      onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="absolute overflow-hidden" style={{ left: offX, top: offY, width: BOARD_W, height: BOARD_H, transform: `scale(${s})`, transformOrigin: "0 0", background: "#f7f3ea" }}>
        {[...pieces].sort((a, b) => a.z - b.z).map((p) => (
          <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, width: p.w, height: p.h, zIndex: p.z, cursor: cropping && selected === p.id ? "grab" : "move",
            filter: p.rough ? "drop-shadow(0 3px 4px rgba(0,0,0,.28))" : undefined }}
            onPointerDown={(e) => onDown(e, p, "move")}
            onWheel={(e) => { if (cropping && selected === p.id) actions.zoom(p.zoom - e.deltaY / 400); }}>
            <div className="h-full w-full overflow-hidden" style={{ clipPath: p.rough ? roughEdge(p.id) : undefined }}>
              {p.kind === "photo" && (
                <img src={p.src} alt="" draggable={false} className="h-full w-full object-cover"
                  style={{ objectPosition: `${p.cropX}% ${p.cropY}%`, transform: `scale(${p.zoom})`, transformOrigin: `${p.cropX}% ${p.cropY}%` }} />
              )}
              {p.kind === "swatch" && <div className="h-full w-full" style={{ background: p.color }} />}
              {p.kind === "title" && (
                <div className="flex h-full w-full items-center justify-center rounded-[60px]" style={{ background: "#f2e3c6" }}>
                  <span style={{ font: `400 ${p.h * 0.62}px/1 var(--font-hand)`, color: "#4a2a26", letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.text}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {rect && sel && (
        <>
          <div className="pointer-events-none absolute" style={{ ...rect, outline: `2px solid ${board.cropping ? "#d9822b" : "#1b1c1e"}`, outlineOffset: 2, boxShadow: "0 0 0 4px rgba(255,255,255,.7)" }} />
          <div className="absolute h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-[#1b1c1e]"
            style={{ left: rect.left + rect.width - 8, top: rect.top + rect.height - 8 }}
            onPointerDown={(e) => onDown(e, sel, "resize")} />
          {chrome?.(rect)}
        </>
      )}
    </div>
  );
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

// The actions a layout can show, with labels in one place so all three say the same thing.
export function useTools(board: Board) {
  const p = board.piece;
  return useMemo(() => p ? [
    ...(p.kind === "photo" ? [{ key: "crop", label: board.cropping ? "Done cropping" : "Crop", on: board.actions.toggleCrop, active: board.cropping }] : []),
    { key: "rough", label: "Rough edge", on: board.actions.toggleRough, active: p.rough },
    { key: "forward", label: "Forward", on: board.actions.forward, active: false },
    { key: "back", label: "Back", on: board.actions.back, active: false },
    { key: "delete", label: "Delete", on: board.actions.remove, active: false },
  ] : [], [p, board.cropping, board.actions]);
}

// A save thumbnail you can click or drag onto the board.
export function SaveThumb({ save, board, className = "", style }: { save: Save; board: Board; className?: string; style?: React.CSSProperties }) {
  return (
    <button type="button" draggable className={`relative shrink-0 overflow-hidden ${className}`} style={style}
      onDragStart={(e) => e.dataTransfer.setData("text/selvedge-save", save.id)}
      onClick={() => board.actions.addSave(save)} aria-label={`Add a ${save.source} save to the board`}>
      <img src={save.src} alt="" draggable={false} className="h-full w-full object-cover" />
    </button>
  );
}
