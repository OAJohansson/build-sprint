"use client";

/* eslint-disable @next/next/no-img-element */
// My Inspo (every save): the Inbox, where a share lands, and my Folders (owner's naming, 23 Oct).
// The Inbox shows every save not yet in a folder, newest first, split by small day markers, as
// prints in the sketchbook look. Folders are mine to make and name; tap saves to pick them, then
// Move to puts them in one, and they leave the Inbox (a save lives in one place). A folder can
// show each save's colours (colour notes, per folder). Add photos picks them from the computer or gallery, or drop them anywhere on a laptop;
// both upload like shares. What's still waiting on this device shows on top; a link whose picture
// couldn't be fetched asks for a screenshot (3b).

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { imageUrl, type Folder, type Save } from "@/lib/library";
import { AccessGate } from "@/components/access-gate";
import { SketchFilters } from "@/components/sketch-filters";
import { byDay } from "@/lib/days";
import { paletteFrom } from "@/lib/palette";
import { dropFromQueue, enqueueFiles, listQueue, onQueueChange, retryUploads, type QueueItem } from "@/lib/queue";

export default dynamic(() => Promise.resolve(Inbox), { ssr: false });

const WAITING: Record<QueueItem["state"], string> = {
  queued: "Saving…",
  offline: "Waiting for a connection",
  locked: "Waiting for your access code",
  failed: "Couldn't save. It'll try again",
  unreadable: "This picture type can't be opened",
};

// Which page is showing lives in the address, so the phone's back button goes back a page.
type View = { page: "days" } | { page: "folders" } | { page: "folder"; id: string };
function readView(): View {
  const q = new URLSearchParams(location.search);
  const id = q.get("folder");
  return id ? { page: "folder", id } : q.has("folders") ? { page: "folders" } : { page: "days" };
}
const viewUrl = (v: View) => (v.page === "folder" ? `/inbox?folder=${v.id}` : v.page === "folders" ? "/inbox?folders" : "/inbox");
const tiltOf = (i: number) => `${((i * 37) % 5) - 2}deg`;

function Inbox() {
  const [access, setAccess] = useState<boolean | null>(null);
  const [saves, setSaves] = useState<Save[] | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [missed] = useState(() => new URLSearchParams(location.search).get("missed"));
  const [view, setView] = useState<View>(readView);
  // A tap on any card picks it (owner, 23 Oct: no Select step); the bar shows while any are picked.
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const refresh = useCallback(() => {
    listQueue().then(setQueue, () => setQueue([]));
    fetch("/api/saves").then((r) => (r.ok ? r.json() : null)).then((d) => d && setSaves(d.saves), () => {});
    fetch("/api/folders").then((r) => (r.ok ? r.json() : null)).then((d) => d && setFolders(d.folders), () => {});
  }, []);

  useEffect(() => {
    fetch("/api/access").then((r) => r.json()).then((d) => setAccess(!!d.ok), () => setAccess(false));
    refresh();
    retryUploads();
    const off = onQueueChange(refresh);
    const back = () => { setView(readView()); setPicked(new Set()); };
    addEventListener("online", retryUploads);
    addEventListener("popstate", back);
    return () => { off(); removeEventListener("online", retryUploads); removeEventListener("popstate", back); };
  }, [refresh]);

  function go(v: View) {
    history.pushState(null, "", viewUrl(v));
    setView(v);
    setPicked(new Set());
    scrollTo(0, 0);
  }

  async function moveTo(folderId: string | null) {
    if (!picked.size) return;
    const ids = [...picked];
    setSaves((all) => all && all.map((s) => (picked.has(s.id) ? { ...s, folderId } : s)));
    setPicked(new Set());
    setMoving(false);
    await fetch("/api/saves", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids, folderId }) });
    refresh();
  }

  async function removePicked() {
    if (!picked.size || !confirm(picked.size === 1 ? "Remove this save for good?" : `Remove these ${picked.size} saves for good?`)) return;
    await Promise.all([...picked].map((id) => fetch(`/api/saves?id=${id}`, { method: "DELETE" })));
    setPicked(new Set());
    refresh();
  }

  async function saveFolder(f: Pick<Folder, "id" | "name" | "colourNotes">): Promise<boolean> {
    const r = await fetch(`/api/folders?id=${f.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    if (!r.ok) return false;
    const { folder } = (await r.json()) as { folder: Folder };
    setFolders((all) => (all.some((x) => x.id === folder.id) ? all.map((x) => (x.id === folder.id ? folder : x)) : [...all, folder]));
    return true;
  }

  async function newFolder(name: string): Promise<string | null> {
    const id = crypto.randomUUID();
    return (await saveFolder({ id, name, colourNotes: false })) ? id : null;
  }

  async function deleteFolder(f: Folder) {
    if (!confirm(`Delete "${f.name}"? Its photos go back to your inbox.`)) return;
    await fetch(`/api/folders?id=${f.id}`, { method: "DELETE" });
    go({ page: "folders" });
    refresh();
  }

  // Photos from the computer (or the phone's gallery), picked with Add photos or dropped anywhere
  // on the inbox, are queued and uploaded like shares (requirement 5; owner, 23 Oct).
  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");
  async function addFiles(list: FileList | null) {
    const files = [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    await enqueueFiles(files);
    if (view.page !== "days") go({ page: "days" });
    refresh();
  }
  function drop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  if (access === false) return <AccessGate onOpen={() => { setAccess(true); retryUploads(); refresh(); }} />;

  const folder = view.page === "folder" ? folders.find((f) => f.id === view.id) : undefined;
  const loose = saves?.filter((s) => !s.folderId) ?? [];
  const inFolder = (id: string) => saves?.filter((s) => s.folderId === id) ?? [];
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="ed t-sketchbook1 min-h-dvh"
      onDragOver={(e) => { if (hasFiles(e)) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={(e) => { if (!e.relatedTarget) setDragging(false); }}
      onDrop={drop}>
      <SketchFilters />
      {/* The tabs sit by the logo, as on the board; the main action, Add photos, on the right. */}
      <header className="ed-top mx-auto flex w-full max-w-4xl items-center gap-1 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <span className="ed-logo mr-3 sm:mr-5">Selvedge</span>
        <button className="ed-btn ed-tab" data-active={view.page === "days" ? "" : undefined} onClick={() => go({ page: "days" })}><span>Inbox</span></button>
        <button className="ed-btn ed-tab" data-active={view.page !== "days" ? "" : undefined} onClick={() => go({ page: "folders" })}><span>Folders</span></button>
        {/* To the boards, where the tray shows this same Inbox and Folders (owner, 23 Oct). Laptop
            only: boards are made on the laptop (brief), and a phone has no room for a fourth tab. */}
        <a href="/board" className="ed-btn ed-tab hidden items-center sm:inline-flex"><span>Boards</span></a>
        <label className="ed-btn ed-quiet ml-auto inline-flex cursor-pointer items-center !text-[var(--ink)]">
          <span>+ Add<span className="hidden sm:inline"> photos</span></span>
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </label>
      </header>

      <main className={`mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-5 ${picked.size ? "pb-28" : "pb-12"}`}>
        {view.page !== "folder" && <h1 className="ed-tray-title self-start">Inspo</h1>}
        {view.page === "days" && (
          <>
            {missed && <p className="inbox-miss">That share arrived before the app was ready, so it wasn&apos;t kept. Share it again.</p>}
            {queue.length > 0 && (
              <ul className="flex flex-col gap-2">
                {queue.map((q) => (
                  <li key={q.id} className="inbox-wait">
                    <span className="truncate">{q.file ? "Photo" : q.url || q.text || "Link"}</span>
                    <span className="shrink-0">{WAITING[q.state]}</span>
                    {q.state === "unreadable" && <button className="shrink-0 underline" onClick={() => dropFromQueue(q.id).then(refresh)}>Remove</button>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {view.page === "folder" && folder && (
          <FolderHead folder={folder} onBack={() => go({ page: "folders" })} onSave={saveFolder} onDelete={() => deleteFolder(folder)} />
        )}

        {saves === null ? null : view.page === "days" ? (
          loose.length === 0 && queue.length === 0 ? (
            <p className="text-[var(--muted)]">
              {saves.length ? "Everything is in a folder. New saves land here." : "Nothing saved yet. Share a post, a pin or a screenshot to Selvedge, or add photos from your computer."}
            </p>
          ) : (
            byDay(loose).map((d) => (
              <section key={d.label} className="inbox-day-group flex flex-col gap-3">
                <h2 className="inbox-divider">{d.label}</h2>
                <Prints saves={d.items} picked={picked} onToggle={toggle} />
              </section>
            ))
          )
        ) : view.page === "folders" ? (
          <Folders folders={folders} saves={saves} onOpen={(id) => go({ page: "folder", id })} onNew={newFolder} />
        ) : folder ? (
          inFolder(folder.id).length ? (
            <Prints saves={inFolder(folder.id)} picked={picked} onToggle={toggle} notes={folder.colourNotes} />
          ) : (
            <p className="text-[var(--muted)]">Nothing in here yet. In your inbox, tap photos to pick them, then Move to.</p>
          )
        ) : (
          <p className="text-[var(--muted)]">That folder is gone. <button className="underline" onClick={() => go({ page: "folders" })}>Back to folders</button></p>
        )}
      </main>

      {picked.size > 0 && (
        <div className="inbox-bar gap-2">
          <button className="ed-btn ed-tab" data-active="" onClick={() => setMoving(true)}><span>Move to…</span></button>
          <button className="ed-btn ed-tool" data-danger="" onClick={removePicked}><span>Remove</span></button>
          <button className="ed-btn ed-quiet" onClick={() => setPicked(new Set())}><span>Cancel</span></button>
        </div>
      )}

      {moving && picked.size > 0 && (
        <MoveSheet folders={folders.filter((f) => view.page !== "folder" || f.id !== view.id)} fromFolder={view.page === "folder"}
          onPick={moveTo} onNew={async (name) => { const id = await newFolder(name); if (id) await moveTo(id); }} onClose={() => setMoving(false)} />
      )}

      {dragging && <div className="inbox-drop">Drop photos to save them</div>}
    </div>
  );
}

// Saves as prints. A tap picks one: the board picker's yellow dot (pick D). The card isn't a
// <button> so a link inside it (a post without its picture) stays a real link.
function Prints({ saves, picked, onToggle, notes }: { saves: Save[]; picked: Set<string>; onToggle: (id: string) => void; notes?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
      {saves.map((s, i) => {
        const print = (
          <div className="inbox-print" style={{ ["--tilt" as string]: tiltOf(i) }}>
            {s.hasImage ? (
              <img src={imageUrl(s.id)} alt="" loading="lazy" style={{ aspectRatio: 3 / 4 }} />
            ) : (
              <div className="inbox-miss" style={{ aspectRatio: 3 / 4 }}>
                <span>Couldn&apos;t get the picture from this {s.source === "instagram" ? "post" : s.source === "pinterest" ? "pin" : "link"}. Take a screenshot and share that instead.</span>
                {s.link && <a href={s.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="truncate text-[var(--muted)] underline">{new URL(s.link).hostname}</a>}
              </div>
            )}
            {notes && s.hasImage && <ColourNotes id={s.id} />}
          </div>
        );
        return (
          <li key={s.id}>
            <div role="button" tabIndex={0} className="pick-tile inbox-pick relative block w-full" aria-pressed={picked.has(s.id)} aria-label="Pick this save"
              onClick={() => onToggle(s.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(s.id); } }}>
              {print}
              <svg className="pick-dot" viewBox="0 0 22 22" aria-hidden="true">
                <circle cx="11" cy="11" r="7.5" fill="#f2d666" style={{ filter: "url(#ink-bleed)" }} />
                <circle cx="9" cy="9" r="2.6" fill="#f7e595" opacity=".8" />
              </svg>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Colour notes: three watercolour dots of a save's own colours, read in the browser (no AI).
const palettes = new Map<string, Promise<string[]>>();
function ColourNotes({ id }: { id: string }) {
  const [colours, setColours] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    if (!palettes.has(id)) palettes.set(id, paletteFrom([imageUrl(id)], 3));
    palettes.get(id)!.then((c) => live && setColours(c));
    return () => { live = false; };
  }, [id]);
  return <div className="inbox-dots" aria-hidden="true">{colours.map((c) => <i key={c} style={{ background: c }} />)}</div>;
}

function Folders({ folders, saves, onOpen, onNew }: { folders: Folder[]; saves: Save[]; onOpen: (id: string) => void; onNew: (name: string) => Promise<string | null> }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
      {folders.map((f) => {
        const inside = saves.filter((s) => s.folderId === f.id);
        const covers = inside.filter((s) => s.hasImage).slice(0, 4);
        return (
          <li key={f.id}>
            <button className="inbox-folder" onClick={() => onOpen(f.id)}>
              <div className="inbox-cover">
                {Array.from({ length: 4 }, (_, i) => (covers[i] ? <img key={i} src={imageUrl(covers[i].id)} alt="" loading="lazy" /> : <span key={i} />))}
              </div>
              <span className="inbox-day mt-2 block truncate">{f.name}</span>
              <span className="text-[15px] text-[var(--muted)]">{inside.length === 1 ? "1 photo" : `${inside.length} photos`}</span>
            </button>
          </li>
        );
      })}
      <li><NewFolder onNew={onNew} card /></li>
    </ul>
  );
}

function NewFolder({ onNew, card, onMade }: { onNew: (name: string) => Promise<string | null>; card?: boolean; onMade?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  if (!open) {
    return (
      <button className={card ? "inbox-new grid aspect-square w-full place-items-center text-[var(--muted)]" : "ed-btn ed-quiet"} onClick={() => setOpen(true)}>
        <span>+ New folder</span>
      </button>
    );
  }
  return (
    <form className="flex flex-col gap-2" onSubmit={async (e) => { e.preventDefault(); if (name.trim() && (await onNew(name.trim()))) { setName(""); setOpen(false); onMade?.(); } }}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Folder name" className="inbox-field w-full" />
      <div className="flex gap-1">
        <button className="ed-btn ed-tab" data-active="" disabled={!name.trim()}><span>Make it</span></button>
        <button type="button" className="ed-btn ed-quiet" onClick={() => setOpen(false)}><span>Cancel</span></button>
      </div>
    </form>
  );
}

function FolderHead({ folder, onBack, onSave, onDelete }: { folder: Folder; onBack: () => void; onSave: (f: Folder) => Promise<boolean>; onDelete: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.name);
  return (
    <div className="flex flex-col gap-2">
      <button className="ed-btn ed-quiet -ml-3 self-start" onClick={onBack}><span>← Folders</span></button>
      {renaming ? (
        <form className="flex flex-wrap items-center gap-2" onSubmit={async (e) => { e.preventDefault(); if (name.trim() && (await onSave({ ...folder, name: name.trim() }))) setRenaming(false); }}>
          <input autoFocus onFocus={(e) => e.target.select()} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="inbox-field min-w-0 flex-1" />
          <button className="ed-btn ed-tab" data-active="" disabled={!name.trim()}><span>Save</span></button>
          <button type="button" className="ed-btn ed-quiet" onClick={() => { setName(folder.name); setRenaming(false); }}><span>Cancel</span></button>
        </form>
      ) : (
        <h1 className="ed-tray-title self-start">{folder.name}</h1>
      )}
      <div className="-ml-3 flex flex-wrap gap-1">
        {!renaming && <button className="ed-btn ed-quiet" onClick={() => setRenaming(true)}><span>Rename</span></button>}
        <button className="ed-btn ed-tab" aria-pressed={folder.colourNotes} data-active={folder.colourNotes ? "" : undefined}
          onClick={() => onSave({ ...folder, colourNotes: !folder.colourNotes })}>
          <span>Colour notes {folder.colourNotes ? "on" : "off"}</span>
        </button>
        <button className="ed-btn ed-quiet" onClick={onDelete}><span>Delete folder</span></button>
      </div>
    </div>
  );
}

function MoveSheet({ folders, fromFolder, onPick, onNew, onClose }: {
  folders: Folder[]; fromFolder: boolean; onPick: (folderId: string | null) => void; onNew: (name: string) => Promise<void>; onClose: () => void;
}) {
  return (
    <>
      <div className="inbox-scrim" onClick={onClose} />
      <div className="inbox-sheet" role="dialog" aria-label="Move to">
        <p className="ed-tray-title mb-3">Move to</p>
        <ul className="-ml-3 flex flex-col items-start">
          {fromFolder && <li><button className="ed-btn" onClick={() => onPick(null)}><span>Back to the inbox</span></button></li>}
          {folders.map((f) => <li key={f.id}><button className="ed-btn" onClick={() => onPick(f.id)}><span>{f.name}</span></button></li>)}
        </ul>
        <div className="mt-2 -ml-3">
          <NewFolder onNew={async (name) => { await onNew(name); return "made"; }} />
        </div>
      </div>
    </>
  );
}
