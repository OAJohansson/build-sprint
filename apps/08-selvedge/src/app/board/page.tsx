"use client";

/* eslint-disable @next/next/no-img-element */
// The board editor (laptop): Sketchbook V1 as the owner locked it (22 Oct), on real saves. Boards
// by season as tabs; "+ New board" names it and picks its saves, which become the board's tray;
// the board starts empty and photos are dragged on (feedback 3). Every edit autosaves a moment
// later, so the board is the same on any device.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { SketchFilters } from "@/components/sketch-filters";
import { AccessGate } from "@/components/access-gate";
import { BOARD_H, BOARD_W, BoardCanvas, FALLBACK_PALETTE, LOGO_YELLOW, PILL_CREAM, SHAPES, useBoardEditor, useTools, type Rect, type ShapeKind } from "@/components/board/engine";
import { imageUrl, type Board, type BoardDoc, type BoardSummary, type Folder, type Save } from "@/lib/library";
import { cutOut } from "@/lib/cutout";
import { paletteFrom } from "@/lib/palette";
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

  // The latest arrangement of the open board, so a rename saves it under the new name.
  const latest = useRef<BoardDoc | null>(null);
  const open = useCallback(async (id: string) => {
    const r = await fetch(`/api/boards?id=${id}`);
    if (!r.ok) return;
    const b: Board = (await r.json()).board;
    latest.current = b.doc;
    setBoard(b);
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
    const leave = () => flush(true); // following the Inbox link
    document.addEventListener("visibilitychange", away);
    addEventListener("pagehide", leave);
    return () => { document.removeEventListener("visibilitychange", away); removeEventListener("pagehide", leave); };
  }, [flush]);

  async function makeBoard(name: string) {
    // An empty board; saves are dragged on from the tray, which shows them all (owner, 23 Oct).
    const next: Board = { id: crypto.randomUUID(), name, doc: { pieces: [] }, updatedAt: new Date().toISOString() };
    const r = await fetch(`/api/boards?id=${next.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, doc: next.doc }) });
    if (!r.ok) return setSaveState("failed");
    setBoards((bs) => [{ id: next.id, name, updatedAt: next.updatedAt }, ...bs]);
    latest.current = next.doc;
    setBoard(next);
    setPicking(false);
  }

  // The board menu (owner, 23 Oct): rename the open board, or delete it for good.
  async function renameBoard(name: string) {
    if (!board) return;
    setBoard({ ...board, name });
    setBoards((bs) => bs.map((b) => (b.id === board.id ? { ...b, name } : b)));
    queueSave(board.id, name, latest.current ?? board.doc);
    await flush();
  }
  async function deleteBoard() {
    if (!board || !confirm(`Delete "${board.name}"? This can't be undone.`)) return;
    clearTimeout(timer.current);
    pending.current = null; // nothing left to autosave
    const r = await fetch(`/api/boards?id=${board.id}`, { method: "DELETE" });
    if (!r.ok) return setSaveState("failed");
    const rest = boards.filter((b) => b.id !== board.id);
    setBoards(rest);
    history.replaceState(null, "", "/board");
    if (rest[0]) await open(rest[0].id);
    else { setBoard(null); setPicking(true); }
  }

  // The sidebar folds away (owner, 23 Oct): a ‹ on its edge on hover, a faint › to bring it back,
  // and ⌘\ as in Figma. Remembered on this device.
  const [trayOpen, setTrayOpen] = useLocalStorage("selvedge.trayOpen", true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); setTrayOpen(!trayOpen); } };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [trayOpen, setTrayOpen]);

  if (access === false) return <AccessGate onOpen={() => load()} />;
  if (!saves) return null;

  const photos = saves.filter((s) => s.hasImage);
  const switchTo = async (id: string) => { await flush(); setPicking(false); open(id); };

  return (
    <div className={`ed t-sketchbook1 grid h-dvh grid-rows-[64px_1fr] transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none ${trayOpen ? "grid-cols-[264px_1fr]" : "grid-cols-[0px_1fr]"}`}>
      <SketchFilters />

      {board && !picking ? (
        <Editor key={board.id} board={board} saves={saves} photos={photos} boards={boards} saveState={saveState}
          onChange={(doc) => { latest.current = doc; queueSave(board.id, board.name, doc); }}
          onSwitch={switchTo} onNew={async () => { await flush(); setPicking(true); }}
          onRename={renameBoard} onDelete={deleteBoard} trayOpen={trayOpen} onTray={setTrayOpen} />
      ) : (
        <>
          <Header boards={boards} current={null} onSwitch={switchTo} onNew={() => setPicking(true)} />
          <aside className={`ed-tray p-4 ${trayOpen ? "" : "invisible"}`} />
          <main className="ed-stage relative overflow-y-auto p-8">
            <NewBoard name={newBoardName(new Date(), boards.map((b) => b.name))} onMake={makeBoard}
              onCancel={board ? () => setPicking(false) : undefined} />
          </main>
        </>
      )}
    </div>
  );
}

type BoardMenuActions = { onRename: (name: string) => void; onDownload: () => void; onDelete: () => void; downloading: boolean };

function Header({ boards, current, onSwitch, onNew, menu, right }: { boards: BoardSummary[]; current: string | null; onSwitch: (id: string) => void; onNew: () => void; menu?: BoardMenuActions; right?: React.ReactNode }) {
  return (
    <header className="ed-top col-span-2 flex items-center gap-5 px-6">
      <span className="ed-logo">Selvedge</span>
      {/* Back to my Inspo, where saves land (owner, 23 Oct); the autosave flushes as the page goes. */}
      <a href="/inbox" className="ed-btn ed-tab inline-flex items-center"><span>Inspo</span></a>
      <nav className="flex items-center gap-1">
        {boards.map((b) => (b.id === current && menu ? <BoardMenu key={b.id} name={b.name} {...menu} /> : (
          <button key={b.id} onClick={() => onSwitch(b.id)} className="ed-btn ed-tab" data-active={b.id === current ? "" : undefined}><span>{b.name}</span></button>
        )))}
        <button onClick={onNew} className="ed-btn ed-tab ed-quiet"><span>+ New board</span></button>
      </nav>
      {right}
    </header>
  );
}

// The open board's tab: click its name for Rename, Download and Delete (owner, 23 Oct).
function BoardMenu({ name, onRename, onDownload, onDelete, downloading }: { name: string } & BoardMenuActions) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("pointerdown", away);
    addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [open]);
  if (renaming) {
    return (
      <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { onRename(draft.trim()); setRenaming(false); } }}>
        <input autoFocus onFocus={(e) => e.target.select()} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={80} aria-label="Board name"
          onKeyDown={(e) => { if (e.key === "Escape") { setDraft(name); setRenaming(false); } }}
          className="h-8 w-48 rounded-md border border-black/20 bg-white/70 px-2 text-[16px]" />
        <button className="ed-btn ed-tab" data-active="" disabled={!draft.trim()}><span>Save</span></button>
      </form>
    );
  }
  return (
    <div ref={ref} className="relative">
      <button className="ed-btn ed-tab" data-active="" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{downloading ? "Getting the image ready…" : name} <span aria-hidden="true">▾</span></span>
      </button>
      {open && (
        <div role="menu" className="ed-chip desk-chip absolute left-0 top-full z-50 mt-2 flex flex-col items-start" style={{ transform: "none" }}>
          <button role="menuitem" className="ed-btn" onClick={() => { setOpen(false); setDraft(name); setRenaming(true); }}><span>Rename</span></button>
          <button role="menuitem" className="ed-btn" onClick={() => { setOpen(false); onDownload(); }}><span>Download</span></button>
          <button role="menuitem" className="ed-btn ed-tool" data-danger="" onClick={() => { setOpen(false); onDelete(); }}><span>Delete</span></button>
        </div>
      )}
    </div>
  );
}

function Editor({ board, saves, photos, boards, saveState, onChange, onSwitch, onNew, onRename, onDelete, trayOpen, onTray }: {
  board: Board; saves: Save[]; photos: Save[]; boards: BoardSummary[]; saveState: SaveState;
  onChange: (doc: BoardDoc) => void; onSwitch: (id: string) => void; onNew: () => void;
  onRename: (name: string) => void; onDelete: () => void; trayOpen: boolean; onTray: (open: boolean) => void;
}) {
  // The tray mirrors the inbox (owner, 23 Oct): Inspo, as Inbox (saves not in a folder) and Folders,
  // so every save is in reach while making the board; one already on it is marked. Folders are the
  // shortlists; the per-board tray of picked saves is gone (an old board's `tray` is ignored).
  const [folders, setFolders] = useState<Folder[]>([]);
  const [view, setView] = useState<"days" | "folders" | { folder: string }>("days");
  useEffect(() => { fetch("/api/folders").then((r) => (r.ok ? r.json() : null)).then((d) => d && setFolders(d.folders), () => {}); }, []);
  const editor = useBoardEditor(board.doc.pieces, (pieces) => onChange({ pieces }), (id) => saves.find((x) => x.id === id)?.aspect ?? 0.75);
  const p = editor.piece;

  // Background removal (feedback 7): made once per save in the browser, kept beside the original;
  // a piece switches between the photo and its cut-out.
  const [cutting, setCutting] = useState<{ id: string; label: string } | null>(null);
  const [versions, setVersions] = useState<Record<string, number>>({});
  // Quick by default; "careful" (BEN2) redoes a hard one, slower and better (owner, 23 Oct).
  async function cutWith(quality: "quick" | "careful") {
    if (!p || p.kind !== "photo" || !p.saveId || cutting) return;
    const saveId = p.saveId, careful = quality === "careful";
    if (!careful) {
      const have = await fetch(`/api/cutouts?id=${saveId}`, { method: "HEAD" }).then((r) => r.ok, () => false);
      if (have) return editor.actions.setCutout(true);
    }
    const working = careful ? "Cutting out carefully… about half a minute" : "Cutting out…";
    setCutting({ id: saveId, label: working });
    try {
      const v = await cutOut(saveId, quality, (pr) => setCutting({ id: saveId, label: pr.stage === "loading"
        ? `${careful ? "Getting the careful scissors ready" : "Getting the scissors ready"}… ${Math.round(pr.progress)}%`
        : working }));
      setVersions((vs) => ({ ...vs, [saveId]: v }));
    } catch (error) {
      console.error(error);
      setCutting({ id: saveId, label: "Couldn't cut this one out" });
      setTimeout(() => setCutting(null), 3000);
      return;
    }
    setCutting(null);
    editor.actions.setCutout(true, careful || undefined);
  }
  const base = useTools(editor);
  const busy = cutting && p?.saveId === cutting.id ? cutting.label : null;
  const tools = p?.kind === "photo" && !editor.cropping
    ? [
        base[0],
        busy
          ? { key: "background", label: busy, on: () => {}, active: true }
          : p.cutout
            ? { key: "background", label: "Restore background", on: () => editor.actions.setCutout(false), active: true }
            : { key: "background", label: "Remove background", on: () => cutWith("quick"), active: false },
        // For the hard ones: redo the cut-out with the careful model.
        ...(p.cutout && !p.careful && !busy ? [{ key: "careful", label: "Cut out more carefully", on: () => cutWith("careful"), active: false }] : []),
        ...base.slice(1),
      ]
    : base;
  const used = new Set(editor.pieces.flatMap((x) => (x.kind === "photo" && x.saveId ? [x.saveId] : [])));
  const loose = photos.filter((s) => !s.folderId);
  const folder = typeof view === "object" ? folders.find((f) => f.id === view.folder) : undefined;

  // Colours for shapes: the board's own palette, read from its photos, plus the pill's cream and
  // the logo's yellow.
  const [palette, setPalette] = useState<string[]>([PILL_CREAM, LOGO_YELLOW, ...FALLBACK_PALETTE]);
  // Read from the photos on the board, or the newest saves while it's empty.
  const paletteKey = (used.size ? [...used] : loose.map((s) => s.id)).slice(0, 18).join();
  useEffect(() => {
    const ids = paletteKey ? paletteKey.split(",") : [];
    paletteFrom(ids.map(imageUrl), 6, FALLBACK_PALETTE).then((c) => setPalette([PILL_CREAM, LOGO_YELLOW, ...c.filter((x) => x !== PILL_CREAM && x !== LOGO_YELLOW)]));
  }, [paletteKey]);

  // Download (owner, 23 Oct): the board as a PNG at twice its size (3200 × 1800), drawn from the
  // board itself so crops, cut-outs and rough edges come out as they look. Nothing is selected
  // while it's taken, so no handles show.
  const [downloading, setDownloading] = useState(false);
  async function download() {
    if (downloading) return;
    setDownloading(true);
    editor.actions.select(null);
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const sheet = document.querySelector<HTMLElement>(".ed-stage .board-sheet");
      if (!sheet?.parentElement) throw new Error("No board on the page");
      // A full-size copy at 0, 0 in a holder off-screen: the board on screen is scaled and offset
      // to fit the window, and html-to-image keeps an element's own position.
      const holder = document.createElement("div");
      Object.assign(holder.style, { position: "fixed", left: "-20000px", top: "0px", width: `${BOARD_W}px`, height: `${BOARD_H}px` });
      const copy = sheet.cloneNode(true) as HTMLElement;
      Object.assign(copy.style, { transform: "none", left: "0px", top: "0px" });
      holder.appendChild(copy);
      sheet.parentElement.appendChild(holder);
      const { toPng } = await import("html-to-image");
      const url = await toPng(copy, { width: BOARD_W, height: BOARD_H, pixelRatio: 2 }).finally(() => holder.remove());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${board.name.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "board"}.png`;
      a.click();
    } catch (error) {
      console.error(error);
      alert("Couldn't make the image. Try again.");
    }
    setDownloading(false);
  }

  // The pipette (owner, 23 Oct): take a shape's colour from a photo on the board. Chrome's own
  // picker can sample anywhere on screen; elsewhere a click on a photo samples it.
  const [sampling, setSampling] = useState(false);
  async function pipette() {
    const Dropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!Dropper) return setSampling(true);
    try { editor.actions.setColor(toHex((await new Dropper().open()).sRGBHex)); } catch {} // Esc cancels
  }
  useEffect(() => {
    if (!sampling) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setSampling(false); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [sampling]);
  const custom = p && p.kind !== "photo" && p.color && !palette.includes(p.color) ? p.color : null;

  const chip = (r: Rect) => (
    <FloatingChip key={p?.id} rect={r}>
      {p && p.kind !== "photo" && (
        <>
          <div className="flex items-center gap-1 px-1" role="radiogroup" aria-label="Colour">
            {[...(custom ? [custom] : []), ...palette].map((c) => (
              <button key={c} role="radio" aria-checked={p.color === c} aria-label={`Colour ${c}`} onClick={() => editor.actions.setColor(c)}
                className="shape-colour" style={{ background: c }} data-on={p.color === c ? "" : undefined} />
            ))}
            <button type="button" className="shape-pipette" aria-label="Take a colour from a photo" title="Take a colour from a photo" onClick={pipette}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.5 2.8a2.3 2.3 0 0 1 3.3 3.3l-1.9 1.9.9.9-1.4 1.4-.9-.9-6.6 6.6H4.1v-2.8l6.6-6.6-.9-.9 1.4-1.4.9.9z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <input aria-label="Text" placeholder="Text" value={p.text ?? ""} maxLength={80} onChange={(e) => editor.actions.setText(e.target.value)}
            className="shape-text" />
        </>
      )}
      {tools.map((t) => (
        <button key={t.key} onClick={t.on} className="ed-btn ed-tool" data-active={t.active ? "" : undefined} data-danger={t.key === "delete" ? "" : undefined}>
          <span>{t.label}</span>
        </button>
      ))}
    </FloatingChip>
  );

  return (
    <>
      <Header boards={boards} current={board.id} onSwitch={onSwitch} onNew={onNew}
        menu={{ onRename, onDownload: download, onDelete, downloading }} right={
        <>
          <span className="ed-quiet ml-auto text-[15px]" aria-live="polite">{saveState === "saving" ? "Saving…" : saveState === "failed" ? "Couldn't save. Check your connection" : ""}</span>
          {/* Undo (owner, 23 Oct), shown only when there's something to undo; ⌘Z works too. */}
          {editor.canUndo && <button className="ed-btn ed-quiet" title="Undo (⌘Z)" onClick={editor.actions.undo}><span>↶ Undo</span></button>}
        </>
      } />

      <aside className={`ed-tray group relative overflow-y-auto p-4 ${trayOpen ? "" : "invisible"}`}>
        <button className="tray-fold" aria-label="Hide the sidebar" title="Hide the sidebar (⌘\)" onClick={() => onTray(false)}>‹</button>
        <p className="ed-tray-title mb-2">Shapes</p>
        <div className="mb-5 flex items-end gap-3">
          {(Object.keys(SHAPES) as ShapeKind[]).map((k) => (
            <button key={k} type="button" draggable className={`shape-pick shape-${k}`} aria-label={`Add a ${SHAPES[k].label.toLowerCase()}`}
              onDragStart={(e) => { e.dataTransfer.setData("text/selvedge-shape", k); e.dataTransfer.setData("text/selvedge-color", k === "pill" ? PILL_CREAM : palette[2] ?? PILL_CREAM); }}
              onClick={() => editor.actions.addShape(k, k === "pill" ? PILL_CREAM : palette[2] ?? PILL_CREAM)}>
              <span>{SHAPES[k].label}</span>
            </button>
          ))}
        </div>
        {/* Inspo: every save, newest first (owner, 23 Oct: the tray is about my saved
            inspiration, not dates), with Inbox and Folders on the same line. */}
        <div className="mb-3 flex items-center">
          <p className="ed-tray-title mr-auto">Inspo</p>
          <button className="ed-btn ed-tab !px-2" data-active={view === "days" ? "" : undefined} onClick={() => setView("days")}><span>Inbox</span></button>
          <button className="ed-btn ed-tab !px-2" data-active={view !== "days" ? "" : undefined} onClick={() => setView("folders")}><span>Folders</span></button>
        </div>
        {view === "days" ? (
          loose.length ? <Thumbs saves={loose} used={used} onAdd={editor.actions.addSave} />
            : <p className="ed-tray-foot">Nothing in your inbox. New saves land here.</p>
        ) : view === "folders" ? (
          folders.length ? (
            <ul className="-ml-3 flex flex-col items-start">
              {folders.map((f) => (
                <li key={f.id}>
                  <button className="ed-btn" onClick={() => setView({ folder: f.id })}>
                    <span>{f.name} <span className="ed-quiet">{photos.filter((s) => s.folderId === f.id).length}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="ed-tray-foot">No folders yet. Make them in the inbox.</p>
        ) : (
          <>
            <div className="-ml-3 mb-2 flex items-baseline gap-1">
              <button className="ed-btn ed-quiet" onClick={() => setView("folders")}><span>← Folders</span></button>
              <span className="truncate">{folder?.name}</span>
            </div>
            <Thumbs saves={photos.filter((s) => s.folderId === folder?.id)} used={used} onAdd={editor.actions.addSave} />
          </>
        )}
      </aside>

      <main className="ed-stage relative p-8">
        {!trayOpen && <button className="tray-unfold" aria-label="Show the sidebar" title="Show the sidebar (⌘\)" onClick={() => onTray(true)}>›</button>}
        <BoardCanvas board={editor} saves={saves} versions={versions} busy={cutting?.id} chrome={chip} className="h-full w-full" />
        {sampling && (
          <div className="absolute inset-0 z-[60] cursor-crosshair" role="button" aria-label="Click a photo to take its colour"
            onPointerDown={async (e) => { e.stopPropagation(); const c = await sampleColour(e.clientX, e.clientY); if (c) editor.actions.setColor(c); setSampling(false); }}>
            <p className="ed-chip absolute left-1/2 top-3 -translate-x-1/2 px-3 py-1 text-[15px]">Click a photo to take its colour</p>
          </div>
        )}
      </main>
    </>
  );
}

// A save in the tray: drag it onto the board or click to add it. A small tick marks one already
// on this board.
function Thumbs({ saves, used, onAdd }: { saves: Save[]; used: Set<string>; onAdd: (s: Save) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {saves.map((s, i) => (
        <button key={s.id} type="button" draggable className="ed-thumb relative aspect-[3/4] shrink-0"
          style={{ ["--tilt" as string]: `${((i * 37) % 5) - 2}deg` }}
          onDragStart={(e) => e.dataTransfer.setData("text/selvedge-save", s.id)}
          onClick={() => onAdd(s)} aria-label={`Add a ${s.source} save to the board${used.has(s.id) ? " (already on it)" : ""}`}>
          <img src={imageUrl(s.id)} alt="" draggable={false} loading="lazy" className="h-full w-full object-cover" />
          {used.has(s.id) && <span className="ed-used" aria-hidden="true">✓</span>}
        </button>
      ))}
    </div>
  );
}

// Making a board: name it (this season by default); it starts empty.
function NewBoard({ name: suggested, onMake, onCancel }: { name: string; onMake: (name: string) => Promise<void>; onCancel?: () => void }) {
  const [name, setName] = useState(suggested);
  const [busy, setBusy] = useState(false);
  return (
    <form className="mx-auto flex max-w-md flex-col gap-4 pt-16" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; setBusy(true); await onMake(name.trim()); setBusy(false); }}>
      <label className="flex flex-col gap-3">
        <span className="ed-tray-title self-start">New board</span>
        <input autoFocus onFocus={(e) => e.target.select()} value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
          className="h-10 w-full rounded-md border border-black/20 bg-white/70 px-3 text-[17px]" />
      </label>
      <div className="-ml-3 flex gap-1">
        <button disabled={!name.trim() || busy} className="ed-btn ed-tab" data-active=""><span>{busy ? "Making…" : "Make the board"}</span></button>
        {onCancel && <button type="button" className="ed-btn ed-quiet" onClick={onCancel}><span>Cancel</span></button>}
      </div>
    </form>
  );
}

// The tool chip by the picked piece, kept fully on screen (owner, 23 Oct): centred above the piece,
// moved in from the edges, and below the piece when there's no room above.
function FloatingChip({ rect, children }: { rect: Rect; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const { left: rl, top: rt, width: rw, height: rh } = rect;
  useLayoutEffect(() => {
    const el = ref.current, box = el?.offsetParent as HTMLElement | null;
    if (!el || !box) return;
    const place = () => {
      const m = 8, w = el.offsetWidth, h = el.offsetHeight;
      const left = Math.max(m, Math.min(rl + rw / 2 - w / 2, box.clientWidth - w - m));
      const above = rt - h - 10;
      const top = above >= m ? above : Math.max(m, Math.min(rt + rh + 10, box.clientHeight - h - m));
      setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
    };
    place();
    const ro = new ResizeObserver(place); // the chip's own size changes (a longer label, text typed)
    ro.observe(el);
    ro.observe(box);
    return () => ro.disconnect();
  }, [rl, rt, rw, rh]);
  return (
    <div ref={ref} className="ed-chip desk-chip absolute z-50 flex items-center gap-1"
      style={{ left: pos?.left ?? rect.left, top: pos?.top ?? rect.top, visibility: pos ? undefined : "hidden" }}
      onPointerDown={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

const toHex = (c: string) => {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  const m = c.match(/\d+/g);
  return m ? "#" + m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, "0")).join("") : "#f2e3c6";
};

/** The colour of the photo under a point on the board (a small average), skipping see-through
 *  parts of cut-outs so the photo underneath counts. */
async function sampleColour(x: number, y: number): Promise<string | null> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 5;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  for (const el of document.elementsFromPoint(x, y)) {
    const img = el.closest(".board-piece")?.querySelector("img");
    if (!img || !img.complete || !img.naturalWidth) continue;
    const r = img.getBoundingClientRect();
    const nx = ((x - r.left) / r.width) * img.naturalWidth, ny = ((y - r.top) / r.height) * img.naturalHeight;
    g.clearRect(0, 0, 5, 5);
    g.drawImage(img, nx - 2, ny - 2, 5, 5, 0, 0, 5, 5);
    const d = g.getImageData(0, 0, 5, 5).data;
    let rr = 0, gg = 0, bb = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; }
    if (n) return "#" + [rr, gg, bb].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("");
  }
  return null;
}
