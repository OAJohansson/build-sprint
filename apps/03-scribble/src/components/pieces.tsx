"use client";

import type { Piece } from "@/lib/types";
import { Struck } from "@/lib/typewriter";
import { wordCount } from "@/lib/week";

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();

const finished = (pieces: Piece[]) =>
  pieces
    .filter((p) => p.status === "done")
    .sort((a, b) => (b.finishedAt ?? b.updatedAt).localeCompare(a.finishedAt ?? a.updatedAt));

/** Everything as one Markdown file: the backup that doesn't depend on the app. */
function exportAll(pieces: Piece[]) {
  const lines = ["# Scribble", ""];
  for (const p of [...finished(pieces), ...pieces.filter((x) => x.status === "draft")]) {
    lines.push(`## ${p.status === "draft" ? "Draft" : day(p.finishedAt ?? p.updatedAt)}: ${p.prompt}`, "", p.body, "");
    if (p.feedback) {
      lines.push(`> What's working: ${p.feedback.strength}`, ">", `> Try next time: ${p.feedback.tryNext}`);
      if (p.feedback.craft) lines.push(">", `> The craft: ${p.feedback.craft}`);
      lines.push("");
    }
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `scribble-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Pieces({
  pieces,
  sound,
  onToggleSound,
  onOpen,
  onBack,
}: {
  pieces: Piece[];
  sound: boolean;
  onToggleSound: () => void;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const list = finished(pieces);
  return (
    <div className="sc sc-done">
      <header className="sc-head">
        <button className="sc-link sc-small" onClick={onBack}>
          ← write
        </button>
        <h1 className="sc-head-title">YOUR PIECES &nbsp;·&nbsp; {list.length}</h1>
      </header>
      <main className="sc-page">
        {list.length === 0 ? (
          <p className="sc-empty">Nothing set down yet. Your first page is waiting.</p>
        ) : (
          <ol className="sc-list">
            {list.map((p) => (
              <li key={p.id}>
                <button className="sc-row" onClick={() => onOpen(p.id)}>
                  <span className="sc-row-meta">
                    {day(p.finishedAt ?? p.updatedAt)} · {wordCount(p.body)} words{p.feedback ? " · read" : ""}
                  </span>
                  <span className="sc-row-prompt">{p.prompt}</span>
                  <span className="sc-row-first">{p.body.split("\n")[0]}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </main>
      <div className="sc-after">
        <button className="sc-link" onClick={() => exportAll(pieces)}>
          export all
        </button>
        <button className="sc-link sc-small" onClick={onToggleSound} aria-pressed={sound}>
          key sound {sound ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}

export function Reading({ piece, onBack }: { piece: Piece; onBack: () => void }) {
  return (
    <div className="sc sc-done">
      <header className="sc-head">
        <button className="sc-link sc-small" onClick={onBack}>
          ← pieces
        </button>
        <span>{day(piece.finishedAt ?? piece.updatedAt)}</span>
      </header>
      <article className="sc-page">
        <h1 className="sc-prompt">
          <Struck text={piece.prompt} red />
        </h1>
        <p className="sc-body">
          <Struck text={piece.body} />
        </p>
        <p className="sc-end" aria-hidden="true">
          ###
        </p>
        {piece.feedback && (
          <p className="sc-body sc-reply">
            <Struck text={`${piece.feedback.strength}\n\n${piece.feedback.tryNext}`} from={5000} red />
          </p>
        )}
        {piece.feedback?.craft && (
          <aside className="sc-craft">
            <span className="sc-craft-label">the craft</span>
            <Struck text={piece.feedback.craft} from={9000} />
          </aside>
        )}
      </article>
    </div>
  );
}
