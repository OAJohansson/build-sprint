"""Score the models on both levels and update results/. Run from the lab folder:

    uv run python scripts/run_eval.py              # every model
    uv run python scripts/run_eval.py tf-idf       # only models whose name contains "tf-idf"

The LLM costs money per reader, so it takes the exam on a fixed sample of 500 of the 10,000
readers; every model also gets rows on that sample, so the comparison is like for like.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402

from folio_lab.baselines import MostPopular, Random  # noqa: E402
from folio_lab.content import TfidfTags  # noqa: E402
from folio_lab.data import (FIRST_EXTRA_ID, add_shelf_books, load_books, load_ratings,  # noqa: E402
                            load_shelf, match_to_goodbooks)
from folio_lab.evaluate import evaluate, slice_summary  # noqa: E402
from folio_lab.llm import LlmRecommender  # noqa: E402
from folio_lab.results import RESULTS, record  # noqa: E402
from folio_lab.splits import Split, eligible_readers, leave_last_out, owner_cases  # noqa: E402

SAMPLE = 500

# (step, model, levels): "full" = all 10,000 readers, "sample" = the 500, "owner" = my 48.
# A model's settings are the owner's calls, logged in the journal. Opus only takes the owner
# level, to keep the cost to about $1 (owner, 18 Oct).
ALL = ("full", "sample", "owner")
MODELS = [
    ("1 baselines", Random, ALL),
    ("1 baselines", MostPopular, ALL),
    ("2 content", TfidfTags, ALL),
    ("2 llm", lambda: LlmRecommender(model="claude-haiku-5-5"), ("sample", "owner")),
    ("2 llm", LlmRecommender, ("owner",)),  # Opus 5.5
]


def main() -> None:
    books, ratings = load_books(), load_ratings()
    readers = eligible_readers(ratings)
    full = [leave_last_out(ratings, readers, 1), leave_last_out(ratings, readers, 5)]
    pick = np.random.default_rng(1).choice(len(readers), size=SAMPLE, replace=False)
    sample = [Split(s.name.replace("readers", f"{SAMPLE} readers"), s.train,
                    [s.cases[i] for i in sorted(pick)]) for s in full]
    shelf = match_to_goodbooks(load_shelf(), books)
    books_ext, shelf = add_shelf_books(books, shelf)
    owner = Split("you, all 48 liked", ratings, owner_cases(shelf, "eval_id"))

    only = sys.argv[1] if len(sys.argv) > 1 else ""
    for step, make, levels in MODELS:
        if only in make().name:
            splits = (full if "full" in levels else []) + (sample if "sample" in levels else [])
            record(score(make, splits, owner if "owner" in levels else None, books, books_ext),
                   step)


def score(make, splits, owner, books, books_ext) -> list[dict]:
    """`make` builds a fresh model; each run fits its own, so nothing leaks between runs."""
    rows, name = [], make().name
    for split in splits:
        result = run(make, split, books)
        if split.name.endswith("last 1"):
            # after the last liked book every rating is 3★ or lower by definition, so
            # regret is only meaningful in the hide-5 run
            result["summary"]["regret"], result["summary"]["regret_n"] = float("nan"), 0
        rows.append(result["summary"])
        print(f"{name:>13} | {split.name}: NDCG@10 {result['summary']['ndcg']:.4f}")
    if owner is None:
        return rows
    result = run(make, owner, books_ext)
    rows.append(result["summary"])
    in_gb = np.array([all(b < FIRST_EXTRA_ID for b in c.targets) for c in owner.cases])
    rows.append(slice_summary(result, in_gb, f"you, the {in_gb.sum()} in goodbooks", name,
                              len(books)))
    hits = result["per_reader"].hit_rate.sum()
    print(f"{name:>13} | you: {hits:.0f} of {len(owner.cases)} found")
    return rows


def run(make, split, books):
    model = make()
    if hasattr(model, "prefetch"):
        model.fit(split.train, books)
        model.prefetch([c.history for c in split.cases])
    result = evaluate(model, split, books)
    if hasattr(model, "stats"):
        log_llm(model, split.name)
    return result


def log_llm(model, run_name: str) -> None:
    """The LLM's own mistakes, before code cleaned them up: results/llm-errors.md."""
    s = model.stats
    named = max(s["named"], 1)
    line = (f"| {model.name} | {run_name} | {s['lists']} | {s['failed_calls']} | {s['named']} | "
            f"{100 * s['matched'] / named:.0f}% | {100 * s['on_shelf'] / named:.1f}% | "
            f"{100 * s['repeated'] / named:.1f}% | {s['padded']} |")
    path = RESULTS / "llm-errors.md"
    head = ("# The LLM's raw mistakes\n\nWritten by `scripts/run_eval.py`. Per run: lists asked "
            "for, calls that failed, books it named, share found in the catalogue (the rest are "
            "real books outside it or made up; see the hallucination check), share already on "
            "the shelf, share repeated, and picks padded with bestsellers.\n\n"
            "| Model | Run | Lists | Failed | Named | In catalogue | On shelf | Repeated | "
            "Padded |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n")
    this = f"| {model.name} | {run_name} |"
    rows = [l for l in (path.read_text().splitlines() if path.exists() else [])
            if l.startswith("| llm") and not l.startswith(this)]
    path.write_text(head + "\n".join(rows + [line]) + "\n")
    # every name it gave that isn't in the catalogue, for the hallucination check
    path = RESULTS / "llm-unmatched.tsv"
    keep = [l for l in (path.read_text().splitlines() if path.exists() else [])
            if not l.startswith(f"{model.name}\t{run_name}\t")]
    path.write_text("\n".join(keep + [f"{model.name}\t{run_name}\t{t}\t{a}"
                                      for t, a in model.unmatched]) + "\n")


if __name__ == "__main__":
    main()
