"use client";

import { useEffect, useRef, useState } from "react";
import type { Api } from "@/lib/api";
import { pickPrompt } from "@/lib/prompts";
import type { Feedback, Piece } from "@/lib/types";
import { keepCaretAtEnd, Struck, useKeyClick, useTypedOut } from "@/lib/typewriter";
import { doneThisWeek, wordCount } from "@/lib/week";
import { Week } from "@/components/week";

type Draft = { id: string; prompt: string; body: string; updatedAt: string };
type Stage = "writing" | "set" | "reading" | "read";
type SaveState = "idle" | "saving" | "saved" | "unsaved";

const DRAFT_KEY = "03-scribble:draft";
const AUTOSAVE_MS = 1500;

function readLocalDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(d: Draft | null) {
  try {
    if (d) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

/** The draft to open: whichever is newer of this device's copy and the server's unfinished piece. */
function openingDraft(pieces: Piece[]): Draft {
  const done = new Set(pieces.filter((p) => p.status === "done").map((p) => p.id));
  const server = pieces.find((p) => p.status === "draft");
  const local = readLocalDraft();
  const localOk = local && !done.has(local.id) && local.body.trim();
  if (localOk && (!server || local.updatedAt >= server.updatedAt)) return local;
  if (server) return { id: server.id, prompt: server.prompt, body: server.body, updatedAt: server.updatedAt };
  return newDraft(pieces);
}

function newDraft(pieces: Piece[], current?: string): Draft {
  return {
    id: crypto.randomUUID(),
    prompt: pickPrompt(pieces.map((p) => p.prompt), current),
    body: "",
    updatedAt: new Date().toISOString(),
  };
}

export function Writer({
  api,
  pieces,
  sound,
  onSaved,
  onOpenPieces,
}: {
  api: Api;
  pieces: Piece[];
  sound: boolean;
  onSaved: (piece: Piece) => void;
  onOpenPieces: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => openingDraft(pieces));
  const [stage, setStage] = useState<Stage>("writing");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const click = useKeyClick(sound);
  const reply = feedback ? `${feedback.strength}\n\n${feedback.tryNext}` : "";
  const typedReply = useTypedOut(reply, stage === "read", click, 18);
  const craftShown = stage === "read" && typedReply.length >= reply.length;
  const typedCraft = useTypedOut(feedback?.craft ?? "", craftShown, click, 18);

  // The learning loop: the last lesson travels into the next piece (feedback #9).
  const lessons = pieces
    .filter((p) => p.status === "done" && p.feedback?.lesson && p.id !== draft.id)
    .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
    .map((p) => p.feedback!.lesson!);
  const lastLesson = lessons[0];

  const done = doneThisWeek(pieces);
  const pieceNo = pieces.filter((p) => p.status === "done").length + (stage === "writing" ? 1 : 0);

  // Every change lands on this device at once, and in the database shortly after typing stops.
  useEffect(() => {
    if (stage !== "writing") return;
    writeLocalDraft(draft.body.trim() ? draft : null);
    if (!draft.body.trim()) return;
    const t = setTimeout(async () => {
      setSaveState("saving");
      try {
        onSaved(await api.save(draft.id, { prompt: draft.prompt, body: draft.body, status: "draft", feedback: null }));
        setSaveState("saved");
      } catch {
        setSaveState("unsaved");
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
    // onSaved and api are stable enough; re-running on them would re-save for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, stage]);

  const update = (patch: Partial<Draft>) => {
    setNotice(null);
    setSaveState((s) => (s === "saved" ? "idle" : s));
    setDraft((d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));
  };

  async function setDown() {
    if (!draft.body.trim()) {
      setNotice("a few words is enough");
      return;
    }
    setSaveState("saving");
    try {
      onSaved(await api.save(draft.id, { prompt: draft.prompt, body: draft.body, status: "done", feedback: null }));
      writeLocalDraft(null);
      setSaveState("saved");
      setStage("set");
      window.scrollTo({ top: 0 });
    } catch {
      setSaveState("unsaved");
      setNotice("not saved yet: it's kept on this device. try again");
    }
  }

  async function askReader() {
    setNotice(null);
    setStage("reading");
    let fb: Feedback;
    try {
      // A beat of "your reader is reading" even when the answer is quick.
      [fb] = await Promise.all([
        api.read({ prompt: draft.prompt, body: draft.body, lastLesson, recentLessons: lessons.slice(0, 5) }),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
    } catch {
      setStage("set");
      setNotice("your reader couldn't be reached. try again in a moment");
      return;
    }
    setFeedback(fb);
    setStage("read");
    try {
      onSaved(await api.save(draft.id, { prompt: draft.prompt, body: draft.body, status: "done", feedback: fb }));
    } catch {
      setNotice("the reply couldn't be saved");
    }
  }

  function freshPage() {
    setDraft(newDraft(pieces, draft.prompt));
    setFeedback(null);
    setNotice(null);
    setSaveState("idle");
    setStage("writing");
  }

  const header = (
    <header className="sc-head">
      <span>SCRIBBLE &nbsp;·&nbsp; NO. {pieceNo}</span>
      <Week done={done} />
      <button className="sc-link sc-small" onClick={onOpenPieces}>
        pieces
      </button>
    </header>
  );

  if (stage !== "writing") {
    return (
      <div className="sc sc-done">
        {header}
        <article className="sc-page page-turn">
          <h1 className="sc-prompt">
            <Struck text={draft.prompt} red />
          </h1>
          <p className="sc-body">
            <Struck text={draft.body} />
          </p>
          <p className="sc-end" aria-hidden="true">
            ###
          </p>
          {stage === "reading" && <p className="sc-reading breathe">your reader is reading</p>}
          {typedReply && (
            <p className="sc-body sc-reply" aria-live="polite">
              <Struck text={typedReply} from={5000} red />
            </p>
          )}
          {typedCraft && (
            <aside className="sc-craft">
              <span className="sc-craft-label">the craft</span>
              <Struck text={typedCraft} from={9000} />
            </aside>
          )}
          {notice && <p className="sc-notice">{notice}</p>}
        </article>
        <div className="sc-after">
          {stage === "set" && (
            <button className="sc-link sc-main" onClick={askReader}>
              Ask for a reader
            </button>
          )}
          {stage !== "reading" && (
            <button className="sc-link" onClick={freshPage}>
              A fresh page
            </button>
          )}
        </div>
      </div>
    );
  }

  const words = wordCount(draft.body);
  const status = notice ?? (saveState === "saving" ? "saving" : saveState === "saved" ? "saved" : saveState === "unsaved" ? "kept on this device" : "");

  return (
    <div className="sc" onClick={() => input.current?.focus()}>
      {header}
      <div className="sc-stage">
        <div className="sc-col">
          <h1 className="sc-prompt" key={draft.prompt}>
            <Struck text={draft.prompt} red />
          </h1>
          <button
            className="sc-link sc-small sc-swap"
            onClick={(e) => {
              e.stopPropagation();
              update({ prompt: newDraft(pieces, draft.prompt).prompt });
            }}
          >
            <span aria-hidden="true">↻</span> not this one
          </button>
          {lastLesson && <p className="sc-last">last time: {lastLesson}</p>}
          <p className="sc-body">
            <Struck text={draft.body} />
            <span className="sc-caret" aria-hidden="true" />
          </p>
        </div>
      </div>
      <footer className="sc-foot" onClick={(e) => e.stopPropagation()}>
        <span className="sc-folio" aria-live="polite">
          — {words} {words === 1 ? "word" : "words"}
          {status && ` · ${status}`} —
        </span>
        <button className="sc-link sc-main" onClick={setDown}>
          set down the pen
        </button>
      </footer>
      <textarea
        ref={input}
        className="sc-input"
        value={draft.body}
        onChange={(e) => {
          click();
          update({ body: e.target.value });
        }}
        onSelect={keepCaretAtEnd}
        aria-label={`Your piece. Prompt: ${draft.prompt}`}
        autoFocus
        autoCapitalize="sentences"
      />
    </div>
  );
}
