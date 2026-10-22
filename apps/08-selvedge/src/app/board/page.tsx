"use client";

/* eslint-disable @next/next/no-img-element */
// The board editor (laptop): Sketchbook V1 as the owner locked it (22 Oct), on real saves. Boards
// by season as tabs; "+ New board" names it and picks its saves, which become the board's tray;
// the board starts empty and photos are dragged on (feedback 3). Every edit autosaves a moment
// later, so the board is the same on any device.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessGate } from "@/components/access-gate";
import { BoardCanvas, tiledDraft, useBoardEditor, useTools, type Rect } from "@/components/board/engine";
import { imageUrl, type Board, type BoardDoc, type BoardSummary, type Save } from "@/lib/library";
import { newBoardName } from "@/lib/season";

export default dynamic(() => Promise.resolve(BoardApp), { ssr: false });

type SaveState = "saved" | "saving" | "failed";

function BoardApp() {
  const [access, setAccess] = useState<boolean | null>(null);
  const [saves, setSaves] = useState<Save[] | null>(null);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [picking, setPicking] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");

  const open = useCallback(async (id: string) => {
    const r = await fetch(`/api/boards?id=${id}`);
    if (r.ok) setBoard((await r.json()).board);
  }, []);

  const load = useCallback(async () => {
    const [s, b] = await Promise.all([fetch("/api/saves"), fetch("/api/boards")]);
    if (s.status === 401) return setAccess(false);
    setAccess(true);
    const list: Save[] = s.ok ? (await s.json()).saves : [];
    const all: BoardSummary[] = b.ok ? (await b.json()).boards : [];
    setSaves(list);
    setBoards(all);
    const wanted = new URLSearchParams(location.search).get("id");
    const first = all.find((x) => x.id === wanted) ?? all[0];
    if (first) await open(first.id); else setPicking(true);
  }, [open]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load awaits the network before setting state
  useEffect(() => { load(); }, [load]);

  // Autosave: the latest pieces go to the server a moment after the last edit.
  const pending = useRef<{ id: string; name: string; doc: BoardDoc } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(async (keepalive = false) => {
    const job = pending.current; if (!job) return;
    pending.current = null;
    setSaveState("saving");
    try {
      const r = await fetch(`/api/boards?id=${job.id}`, { method: "PUT", keepalive, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: job.name, doc: job.doc }) });
      setSaveState(r.ok ? "saved" : "failed");
    } catch {
      setSaveState("failed");
    }
  }, []);
  const queueSave = useCallback((id: string, name: string, doc: BoardDoc) => {
    pending.current = { id, name, doc };
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 700);
  }, [flush]);
  useEffect(() => {
    const away = () => { if (document.visibilityState === "hidden") flush(true); };
    document.addEventListener("visibilitychange", away);
    return () => document.removeEventListener("visibilitychange", away);
  }, [flush]);

  async function makeBoard(name: string, picked: Save[]) {
    // An empty board; the picked saves are its tray, dragged on by hand.
    const next: Board = { id: crypto.randomUUID(), name, doc: { pieces: [], tray: picked.map((s) => s.id) }, updatedAt: new Date().toISOString() };
    const r = await fetch(`/api/boards?id=${next.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, doc: next.doc }) });
    if (!r.ok) return setSaveState("failed");
    setBoards((bs) => [{ id: next.id, name, updatedAt: next.updatedAt }, ...bs]);
    setBoard(next);
    setPicking(false);
  }

  if (access === false) return <AccessGate onOpen={() => load()} />;
  if (!saves) return null;

  const photos = saves.filter((s) => s.hasImage);
  const switchTo = async (id: string) => { await flush(); setPicking(false); open(id); };

  return (
    <div className="ed t-sketchbook1 grid h-dvh grid-cols-[264px_1fr] grid-rows-[64px_1fr]">
      {/* The sketchy line: a little noise bends every border drawn with it. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="pencil-line"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="3.2" /></filter>
        <filter id="wash-edge"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="9" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter>
      </svg>

      {board && !picking ? (
        <Editor key={board.id} board={board} saves={saves} photos={photos} boards={boards} saveState={saveState}
          onChange={(doc) => queueSave(board.id, board.name, doc)}
          onSwitch={switchTo} onNew={async () => { await flush(); setPicking(true); }} />
      ) : (
        <>
          <Header boards={boards} current={null} onSwitch={switchTo} onNew={() => setPicking(true)} />
          <aside className="ed-tray p-4" />
          <main className="ed-stage relative overflow-y-auto p-8">
            <Picker photos={photos} name={newBoardName(new Date(), boards.map((b) => b.name))} onMake={makeBoard}
              onCancel={board ? () => setPicking(false) : undefined} />
          </main>
        </>
      )}
    </div>
  );
}

function Header({ boards, current, onSwitch, onNew, right }: { boards: BoardSummary[]; current: string | null; onSwitch: (id: string) => void; onNew: () => void; right?: React.ReactNode }) {
  return (
    <header className="ed-top col-span-2 flex items-center gap-5 px-6">
      <span className="ed-logo">Selvedge</span>
      <nav className="flex items-center gap-1">
        {boards.map((b) => (
          <button key={b.id} onClick={() => onSwitch(b.id)} className="ed-btn ed-tab" data-active={b.id === current ? "" : undefined}><span>{b.name}</span></button>
        ))}
        <button onClick={onNew} className="ed-btn ed-tab ed-quiet"><span>+ New board</span></button>
      </nav>
      {right}
    </header>
  );
}

function Editor({ board, saves, photos, boards, saveState, onChange, onSwitch, onNew }: {
  board: Board; saves: Save[]; photos: Save[]; boards: BoardSummary[]; saveState: SaveState;
  onChange: (doc: BoardDoc) => void; onSwitch: (id: string) => void; onNew: () => void;
}) {
  // The board's tray: the saves picked for it. "All saves" shows everything; a save dragged on
  // from there joins the board's tray. Older boards (no tray) show all saves.
  const [tray, setTray] = useState<string[] | undefined>(board.doc.tray);
  const [showAll, setShowAll] = useState(!board.doc.tray);
  const trayRef = useRef(tray);
  useEffect(() => { trayRef.current = tray; }, [tray]);
  const editor = useBoardEditor(board.doc.pieces, (pieces) => {
    const used = pieces.flatMap((x) => (x.kind === "photo" && x.saveId ? [x.saveId] : []));
    const t = trayRef.current ? [...new Set([...trayRef.current, ...used])] : undefined;
    if (t && t.length !== trayRef.current?.length) setTray(t);
    onChange(t ? { pieces, tray: t } : { pieces });
  });
  const tools = useTools(editor);
  const p = editor.piece;
  const byId = useMemo(() => new Map(saves.map((s) => [s.id, s])), [saves]);
  const shown = showAll || !tray ? photos : photos.filter((s) => tray.includes(s.id));

  async function redraft() {
    if (!confirm("Start again from a draft? This board's arrangement will be replaced.")) return;
    const onBoard = editor.pieces.filter((x) => x.kind === "photo" && x.saveId).sort((a, b) => a.y - b.y || a.x - b.x).map((x) => byId.get(x.saveId!)).filter((s): s is Save => !!s);
    const picked = onBoard.length ? onBoard : shown.slice(0, 14);
    editor.actions.replaceAll(tiledDraft(picked));
  }

  const chip = (r: Rect) => (
    <div key={p?.id} className="ed-chip desk-chip absolute z-50 flex items-center gap-1"
      style={{ left: r.left + r.width / 2, top: Math.max(8, r.top - 52), transform: "translateX(-50%)" }}
      onPointerDown={(e) => e.stopPropagation()}>
      {tools.map((t) => (
        <button key={t.key} onClick={t.on} className="ed-btn ed-tool" data-active={t.active ? "" : undefined} data-danger={t.key === "delete" ? "" : undefined}>
          <span>{t.label}</span>
        </button>
      ))}
      {editor.cropping && p && (
        <input aria-label="Zoom" type="range" min={1} max={3} step={0.05} value={p.zoom} className="ed-zoom mx-2 w-24"
          onChange={(e) => editor.actions.zoom(Number(e.target.value))} />
      )}
    </div>
  );

  return (
    <>
      <Header boards={boards} current={board.id} onSwitch={onSwitch} onNew={onNew} right={
        <>
          <span className="ed-quiet ml-auto text-[15px]" aria-live="polite">{saveState === "saving" ? "Saving…" : saveState === "failed" ? "Couldn't save. Check your connection" : ""}</span>
          <button className="ed-btn ed-quiet" onClick={redraft}><span>Start again from a draft</span></button>
        </>
      } />

      <aside className="ed-tray overflow-y-auto p-4">
        <p className="ed-tray-title mb-3">Your saves</p>
        {tray && (
          <div className="mb-3 flex gap-1">
            <button className="ed-btn ed-tab" data-active={!showAll ? "" : undefined} onClick={() => setShowAll(false)}><span>This board</span></button>
            <button className="ed-btn ed-tab" data-active={showAll ? "" : undefined} onClick={() => setShowAll(true)}><span>All saves</span></button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {shown.map((s, i) => (
            <button key={s.id} type="button" draggable className="ed-thumb relative aspect-[3/4] shrink-0 overflow-hidden"
              style={{ ["--tilt" as string]: `${((i * 37) % 5) - 2}deg` }}
              onDragStart={(e) => e.dataTransfer.setData("text/selvedge-save", s.id)}
              onClick={() => editor.actions.addSave(s)} aria-label={`Add a ${s.source} save to the board`}>
              <img src={imageUrl(s.id)} alt="" draggable={false} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </aside>

      <main className="ed-stage relative p-8">
        <BoardCanvas board={editor} saves={saves} chrome={chip} className="h-full w-full" />
      </main>
    </>
  );
}

// Making a board: name it (this season by default) and pick the saves to tile.
function Picker({ photos, name: suggested, onMake, onCancel }: { photos: Save[]; name: string; onMake: (name: string, picked: Save[]) => Promise<void>; onCancel?: () => void }) {
  const [name, setName] = useState(suggested);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  if (!photos.length) {
    return <p className="ed-tray-title max-w-md">Nothing to make a board from yet. Share a few pieces to Selvedge from your phone first.</p>;
  }
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <label className="flex items-center gap-3">
        <span className="ed-tray-title">New board</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
          className="h-10 w-64 rounded-md border border-black/20 bg-white/70 px-3 text-[17px]" />
      </label>
      <div className="grid grid-cols-6 gap-3">
        {photos.map((s) => (
          <button key={s.id} type="button" onClick={() => toggle(s.id)} aria-pressed={picked.has(s.id)}
            className={`relative aspect-[3/4] overflow-hidden rounded-sm transition-opacity duration-150 ease-out ${picked.has(s.id) ? "outline outline-2 outline-offset-2 outline-[#3a2a20]" : "opacity-45"}`}>
            <img src={imageUrl(s.id)} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button disabled={!picked.size || !name.trim() || busy} className="ed-btn ed-tab" data-active=""
          onClick={async () => { setBusy(true); await onMake(name.trim(), photos.filter((s) => picked.has(s.id))); setBusy(false); }}>
          <span>{busy ? "Making…" : "Make the board"}</span>
        </button>
        {onCancel && <button className="ed-btn ed-quiet" onClick={onCancel}><span>Cancel</span></button>}
      </div>
    </div>
  );
}
