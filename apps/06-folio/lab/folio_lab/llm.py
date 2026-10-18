"""An LLM as the recommender: show Claude the reader's shelf, ask for books, keep the real ones.

The model alone isn't the system. Claude names books by title and author; code then matches each
name to the catalogue and drops anything already on the shelf, repeated, or unrecognised, so the
exam's guardrails hold. What the model got wrong on its own is counted separately (`stats`), as
the LLM's raw error rates.

Calls go through the Message Batches API (half price, results within the hour) and are cached
on disk by prompt, so a rerun costs nothing and gives the same lists.

The prompt is mirrored in the app (src/lib/server/recommend.ts); change both together.
"""

import hashlib
import json
import time
from pathlib import Path

import numpy as np
import pandas as pd

from .data import _norm_title, _surname

CACHE = Path(__file__).resolve().parent.parent / "cache" / "llm"
ENV = Path(__file__).resolve().parent.parent.parent / ".env.local"

SYSTEM = """You are Folio's book recommender. You read one reader's shelf and suggest books \
they will love next. Suggest real, published books only, each one title by its usual author. \
Never suggest a book that is already on the shelf, in any edition."""

SCHEMA = {
    "type": "object",
    "properties": {
        "picks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "author": {"type": "string"},
                    "because": {"type": "string",
                                "description": "The title of the one shelf book it most follows from"},
                },
                "required": ["title", "author", "because"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["picks"],
    "additionalProperties": False,
}


def shelf_text(rows: list[tuple[str, str, float | None]], max_rated: int = 100,
               max_want: int = 40) -> str:
    """The reader's shelf as the prompt shows it, oldest first: rated books with stars, then
    want-to-reads. shortcut: only the latest `max_rated` rated books and `max_want`
    want-to-reads, to keep prompts small; code still drops any pick that's on the full shelf."""
    rated = [f"- {t} by {a}: {r:g}★" for t, a, r in rows if r is not None and not np.isnan(r)]
    want = [f"- {t} by {a}" for t, a, r in rows if r is None or np.isnan(r)]
    parts = ["Books I've read and rated (1–5 stars), oldest first:", *rated[-max_rated:]]
    if want:
        parts += ["", "Books on my want-to-read list (don't suggest these):", *want[-max_want:]]
    return "\n".join(parts)


def prompt(shelf: str, n: int) -> str:
    return (f"{shelf}\n\nSuggest {n} books I haven't got on my shelf that I'm most likely to "
            f"love, best first.")


def _api_key() -> str | None:
    """ANTHROPIC_API_KEY from the environment or the app's .env.local (never printed)."""
    import os
    if os.environ.get("ANTHROPIC_API_KEY"):
        return os.environ["ANTHROPIC_API_KEY"]
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            if line.startswith("ANTHROPIC_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    return None


class LlmRecommender:
    """Claude names `ask` books (more than k, so dropping a few still leaves 10)."""

    def __init__(self, model: str = "claude-opus-5-5", effort: str = "low", ask: int = 15):
        self.model, self.effort, self.ask = model, effort, ask
        self.name = f"llm {model.removeprefix('claude-')}"

    # catalogue -------------------------------------------------------------------------------
    def fit(self, train: pd.DataFrame, books: pd.DataFrame) -> None:
        first_author = books.authors.str.split(",").str[0]
        self.label = {b: (t, a) for b, t, a in zip(books.book_id, books.title, first_author)}
        self.index: dict = {}
        for b, t, a in zip(books.book_id, books.title, first_author):
            self.index.setdefault((_norm_title(t), _surname(a)), b)
            self.index.setdefault((_norm_title(t), None), b)
        counts = train.groupby("book_id").size().reindex(books.book_id, fill_value=0)
        self.fallback = books.book_id.to_numpy()[np.argsort(-counts.to_numpy(), kind="stable")]
        self.stats = {"lists": 0, "named": 0, "matched": 0, "on_shelf": 0, "repeated": 0,
                      "padded": 0, "failed_calls": 0}
        self.unmatched: list[tuple[str, str]] = []

    def match(self, title: str, author: str):
        """Catalogue id for a name, by normalised title + surname, then title alone."""
        t = _norm_title(title)
        return self.index.get((t, _surname(author))) or self.index.get((t, None))

    # prompts and calls -----------------------------------------------------------------------
    def prompt_for(self, history: pd.DataFrame) -> str:
        rows = [(*self.label[b], r) for b, r in zip(history.book_id, history.rating)
                if b in self.label]
        return prompt(shelf_text(rows), self.ask)

    def _params(self, text: str) -> dict:
        return {"model": self.model, "max_tokens": 4000, "system": SYSTEM,
                "output_config": {"effort": self.effort,
                                  "format": {"type": "json_schema", "schema": SCHEMA}},
                "messages": [{"role": "user", "content": text}]}

    def _key(self, text: str) -> str:
        raw = json.dumps(self._params(text), sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()[:24]

    def _cached(self, text: str):
        path = CACHE / f"{self._key(text)}.json"
        return json.loads(path.read_text()) if path.exists() else None

    def prefetch(self, histories: list[pd.DataFrame]) -> None:
        """Send every uncached prompt in one batch and wait for it."""
        import anthropic
        from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
        from anthropic.types.messages.batch_create_params import Request

        CACHE.mkdir(parents=True, exist_ok=True)
        todo = {}
        for h in histories:
            text = self.prompt_for(h)
            if self._cached(text) is None:
                todo[self._key(text)] = text
        if not todo:
            return
        key = _api_key()
        if not key:
            raise SystemExit("No ANTHROPIC_API_KEY: add it to apps/06-folio/.env.local")
        client = anthropic.Anthropic(api_key=key)
        batch = client.messages.batches.create(requests=[
            Request(custom_id=k, params=MessageCreateParamsNonStreaming(**self._params(t)))
            for k, t in todo.items()])
        print(f"  batch {batch.id}: {len(todo)} prompts to {self.model}")
        while (batch := client.messages.batches.retrieve(batch.id)).processing_status != "ended":
            c = batch.request_counts
            print(f"  … {c.succeeded} done, {c.processing} processing")
            time.sleep(30)
        usage = {"input_tokens": 0, "output_tokens": 0}
        for r in client.messages.batches.results(batch.id):
            out = {"picks": None}
            if r.result.type == "succeeded":
                m = r.result.message
                usage["input_tokens"] += m.usage.input_tokens
                usage["output_tokens"] += m.usage.output_tokens
                text = next((b.text for b in m.content if b.type == "text"), None)
                if m.stop_reason == "end_turn" and text:
                    out = {"picks": json.loads(text)["picks"],
                           "usage": {"in": m.usage.input_tokens, "out": m.usage.output_tokens}}
                else:
                    out["error"] = m.stop_reason
            else:
                out["error"] = r.result.type
            (CACHE / f"{r.custom_id}.json").write_text(json.dumps(out))
        print(f"  tokens: {usage}")

    # the interface every model has ------------------------------------------------------------
    def recommend(self, history: pd.DataFrame, k: int) -> list[int]:
        shelf = set(history.book_id)
        reply = self._cached(self.prompt_for(history)) or {"picks": None}
        picks = reply["picks"] or []
        self.stats["lists"] += 1
        self.stats["failed_calls"] += reply["picks"] is None
        recs: list[int] = []
        for p in picks:
            self.stats["named"] += 1
            b = self.match(p["title"], p["author"])
            if b is None:
                self.unmatched.append((p["title"], p["author"]))
                continue
            self.stats["matched"] += 1
            if b in shelf:
                self.stats["on_shelf"] += 1
            elif b in recs:
                self.stats["repeated"] += 1
            elif len(recs) < k:
                recs.append(int(b))
        # shortcut: if fewer than k picks survive, fill with bestsellers so the list is always
        # 10 long; counted in stats["padded"]. Asking again would be the proper fix.
        for b in self.fallback:
            if len(recs) == k:
                break
            if b not in shelf and b not in recs:
                recs.append(int(b))
                self.stats["padded"] += 1
        return recs
