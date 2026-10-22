"use client";

/* eslint-disable @next/next/no-img-element */
// The board editor's engine, promoted from the prototype (the owner locked Sketchbook V1, 22 Oct):
// the tiled draft, the pieces, every edit (move, resize, crop, layer order, delete, rough edge)
// and the canvas that scales a 1600 × 900 board into its box. The page around it decides where
// the tools and saves sit, and saves the board.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { imageUrl, type Piece, type Save } from "@/lib/library";

export const BOARD_W = 1600;
export const BOARD_H = 900;

/** The palette read off the owner's own Spring / Summer board, used when photos give too few colours. */
export const FALLBACK_PALETTE = ["#4a2a26", "#f2e3c6", "#e4e6e1", "#5f6b66", "#1f2d4d", "#1b1c1e"];

const uid = () => crypto.randomUUID().slice(0, 8);

/** The shapes the tray offers (feedback 5): a square and a rectangle (flat colour, text optional)
 *  and a round pill like the owner's "SPRING / SUMMER" title. */
export const SHAPES = {
  square: { kind: "swatch", w: 160, h: 160, label: "Square" },
  rectangle: { kind: "swatch", w: 300, h: 160, label: "Rectangle" },
  pill: { kind: "title", w: 640, h: 120, label: "Pill" },
} as const;
export type ShapeKind = keyof typeof SHAPES;

/** The pill's cream (from the owner's board) and the logo's yellow, offered with every board's palette. */
export const PILL_CREAM = "#f2e3c6";
export const LOGO_YELLOW = "#f2d666";

/** Dark ink on light colours, cream on dark ones, so text in a shape is always readable. */
export function inkOn(color: string) {
  const n = parseInt(color.slice(1), 16);
  const light = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return light > 0.55 ? "#3a2a20" : "#f7f1e3";
}

/**
 * "Start again from a draft": the photos tiled edge to edge, like the owner's board (two rows
 * when there are four or more). Photos only: shapes and text are added by hand (feedback 5).
 */
export function tiledDraft(picked: Save[]): Piece[] {
  const photos = picked.filter((s) => s.hasImage);
  const rowCount = photos.length >= 4 ? 2 : 1;
  const perRow = Math.ceil(photos.length / rowCount);
  const rows = Array.from({ length: rowCount }, (_, r) => photos.slice(r * perRow, (r + 1) * perRow)).filter((r) => r.length);
  const pieces: Piece[] = [];
  let z = 1;
  rows.forEach((row, r) => {
    // Wider photos get wider tiles, and every row fills the board exactly.
    const total = row.reduce((s, p) => s + (p.aspect ?? 0.75), 0);
    let x = 0;
    row.forEach((save, i) => {
      const w = i === row.length - 1 ? BOARD_W - x : Math.round(((save.aspect ?? 0.75) / total) * BOARD_W);
      const h = BOARD_H / rows.length;
      pieces.push({ id: uid(), kind: "photo", saveId: save.id, x, y: r * h, w, h, z: z++, cropX: 50, cropY: 40, zoom: 1, rough: false });
      x += w;
    });
  });
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

/** One board's pieces and every edit to them. `onChange` gets each new set (for autosave). */
export function useBoardEditor(initial: Piece[], onChange: (pieces: Piece[]) => void) {
  const [pieces, setState] = useState<Piece[]>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);

  const setPieces = useCallback((fn: (p: Piece[]) => Piece[]) => setState(fn), []);
  // Every edit goes to onChange (the page autosaves). The callback sits in a ref so a new one on
  // each render doesn't count as an edit; only a new set of pieces does.
  const loaded = useRef(initial);
  const report = useRef(onChange);
  useEffect(() => { report.current = onChange; });
  useEffect(() => { if (pieces !== loaded.current) report.current(pieces); }, [pieces]);
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
      if (!save.hasImage) return;
      const h = 420, w = Math.round(h * (save.aspect ?? 0.75));
      const id = uid();
      setPieces((ps) => [...ps, { id, kind: "photo", saveId: save.id, x: Math.round((at?.x ?? BOARD_W / 2) - w / 2), y: Math.round((at?.y ?? BOARD_H / 2) - h / 2), w, h, z: Math.max(0, ...ps.map((p) => p.z)) + 1, cropX: 50, cropY: 40, zoom: 1, rough: false }]);
      setSelected(id);
    },
    addShape: (shape: ShapeKind, color: string, at?: { x: number; y: number }) => {
      const { w, h, kind } = SHAPES[shape];
      const id = uid();
      setPieces((ps) => [...ps, { id, kind, color, text: "", x: Math.round((at?.x ?? BOARD_W / 2) - w / 2), y: Math.round((at?.y ?? BOARD_H / 2) - h / 2), w, h, z: Math.max(0, ...ps.map((p) => p.z)) + 1, cropX: 50, cropY: 50, zoom: 1, rough: false }]);
      setSelected(id);
    },
    setColor: (color: string) => piece && piece.kind !== "photo" && update(piece.id, { color }),
    setText: (text: string) => piece && piece.kind !== "photo" && update(piece.id, { text: text.slice(0, 80) }),
    replaceAll: (next: Piece[]) => { setPieces(() => next); setSelected(null); setCropping(false); },
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

  return { pieces, piece, selected, cropping, update, actions };
}

export type BoardEditor = ReturnType<typeof useBoardEditor>;
export type Rect = { left: number; top: number; width: number; height: number };

/** The board itself: scales 1600 × 900 into its box and handles the pointer work. */
export function BoardCanvas({ board, saves, chrome, className = "" }: {
  board: BoardEditor;
  saves: Save[];
  chrome?: (rect: Rect) => React.ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = Math.min(size.w / BOARD_W, size.h / BOARD_H) || 0;
  const offX = (size.w - BOARD_W * s) / 2, offY = (size.h - BOARD_H * s) / 2;

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
    else if (d.mode === "resize") {
      if (p.kind === "photo") {
        // A photo keeps its shape when resized, so nothing gets cropped; only Crop changes the framing.
        const k = Math.max(40 / Math.min(p.w, p.h), (p.w + dx) / p.w, (p.h + dy) / p.h);
        update(d.id, { w: Math.round(p.w * k), h: Math.round(p.h * k) });
      } else update(d.id, { w: Math.max(40, Math.round(p.w + dx)), h: Math.max(40, Math.round(p.h + dy)) });
    }
    else update(d.id, { cropX: clamp(p.cropX - (dx / p.w) * 100 / p.zoom), cropY: clamp(p.cropY - (dy / p.h) * 100 / p.zoom) });
  };
  const onUp = () => { drag.current = null; };

  const byId = useMemo(() => new Map(saves.map((x) => [x.id, x])), [saves]);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const r = box.current!.getBoundingClientRect();
    const at = { x: (e.clientX - r.left - offX) / s, y: (e.clientY - r.top - offY) / s };
    const save = byId.get(e.dataTransfer.getData("text/selvedge-save"));
    const shape = e.dataTransfer.getData("text/selvedge-shape") as ShapeKind;
    if (save) actions.addSave(save, at);
    else if (shape in SHAPES) actions.addShape(shape, e.dataTransfer.getData("text/selvedge-color") || PILL_CREAM, at);
  };

  const sel = pieces.find((p) => p.id === selected);
  const rect: Rect | null = sel ? { left: offX + sel.x * s, top: offY + sel.y * s, width: sel.w * s, height: sel.h * s } : null;

  return (
    <div ref={box} className={`relative select-none ${className}`}
      onPointerDown={() => actions.select(null)} onPointerMove={onMove} onPointerUp={onUp}
      onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      {/* The soft pencil frame around the collage (from V2); outside the sheet so it never clips. */}
      <div className="board-frame pointer-events-none absolute" style={{ left: offX, top: offY, width: BOARD_W * s, height: BOARD_H * s }} />
      <div className="board-sheet absolute overflow-hidden" style={{ left: offX, top: offY, width: BOARD_W, height: BOARD_H, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        {[...pieces].sort((a, b) => a.z - b.z).map((p) => (
          <div key={p.id} className="board-piece absolute" data-selected={selected === p.id ? "" : undefined} style={{ left: p.x, top: p.y, width: p.w, height: p.h, zIndex: p.z, cursor: cropping && selected === p.id ? "grab" : "move",
            filter: p.rough ? "drop-shadow(0 3px 4px rgba(0,0,0,.28))" : undefined }}
            onPointerDown={(e) => onDown(e, p, "move")}
            onWheel={(e) => { if (cropping && selected === p.id) actions.zoom(p.zoom - e.deltaY / 400); }}>
            <div className="h-full w-full overflow-hidden" style={{ clipPath: p.rough ? roughEdge(p.id) : undefined }}>
              {p.kind === "photo" && p.saveId && (
                <img src={imageUrl(p.saveId)} alt="" draggable={false} className="h-full w-full object-cover"
                  style={{ objectPosition: `${p.cropX}% ${p.cropY}%`, transform: `scale(${p.zoom})`, transformOrigin: `${p.cropX}% ${p.cropY}%` }} />
              )}
              {p.kind === "swatch" && (
                <div className="flex h-full w-full items-center justify-center p-[6%] text-center" style={{ background: p.color }}>
                  {p.text && <span style={{ font: `400 ${Math.min(p.h * 0.3, p.w * 0.16)}px/1.05 var(--font-hand)`, color: inkOn(p.color ?? PILL_CREAM), letterSpacing: "0.03em", textTransform: "uppercase" }}>{p.text}</span>}
                </div>
              )}
              {p.kind === "title" && (
                <div className="flex h-full w-full items-center justify-center rounded-[999px] px-[4%]" style={{ background: p.color ?? PILL_CREAM }}>
                  <span className="whitespace-nowrap" style={{ font: `400 ${p.h * 0.62}px/1 var(--font-hand)`, color: p.color ? inkOn(p.color) : "#4a2a26", letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.text}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {rect && sel && (
        <>
          <div className="board-sel pointer-events-none absolute" data-cropping={cropping ? "" : undefined} style={rect} />
          <div className="board-handle absolute h-4 w-4 cursor-nwse-resize"
            style={{ left: rect.left + rect.width - 8, top: rect.top + rect.height - 8 }}
            onPointerDown={(e) => onDown(e, sel, "resize")} />
          {chrome?.(rect)}
        </>
      )}
    </div>
  );
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Sketchbook V1's tools, as locked: Crop, Rough edge, Forward, Back, Delete. */
export function useTools(board: BoardEditor) {
  const p = board.piece;
  return useMemo(() => p ? [
    ...(p.kind === "photo" ? [{ key: "crop", label: board.cropping ? "Done cropping" : "Crop", on: board.actions.toggleCrop, active: board.cropping }] : []),
    { key: "rough", label: "Rough edge", on: board.actions.toggleRough, active: p.rough },
    { key: "forward", label: "Forward", on: board.actions.forward, active: false },
    { key: "back", label: "Back", on: board.actions.back, active: false },
    { key: "delete", label: "Delete", on: board.actions.remove, active: false },
  ] : [], [p, board.cropping, board.actions]);
}
