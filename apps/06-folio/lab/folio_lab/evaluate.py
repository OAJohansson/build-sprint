"""evaluate(model, split): the one exam every recommender takes.

A model is any object with a `name`, `fit(train, books)` (learn from the ratings it may see) and
`recommend(history, k)` (a ranked list of k goodbooks ids for one reader's visible history).
"""

from typing import Protocol

import numpy as np
import pandas as pd

from . import metrics as m
from .splits import Case, Split


class Recommender(Protocol):
    name: str

    def fit(self, train: pd.DataFrame, books: pd.DataFrame) -> None: ...

    def recommend(self, history: pd.DataFrame, k: int) -> list[int]: ...


class GuardrailError(AssertionError):
    """A rule that must never break did break: the model fails the exam outright."""


def check_guardrails(recs: list, history_ids: set, catalog: set, k: int) -> None:
    if len(recs) != k:
        raise GuardrailError(f"expected {k} books, got {len(recs)}")
    if len(set(recs)) != k:
        raise GuardrailError("the same book twice in one list")
    unknown = [b for b in recs if b not in catalog]
    if unknown:
        raise GuardrailError(f"books that don't exist in the catalog: {unknown[:5]}")
    shelved = [b for b in recs if b in history_ids]
    if shelved:
        raise GuardrailError(f"books already on the reader's shelf: {shelved[:5]}")


def evaluate(model: Recommender, split: Split, books: pd.DataFrame, k: int = m.K,
             fit: bool = True) -> dict:
    """Fit on split.train, recommend for every case, check guardrails, grade.

    Returns the per-reader grades (for slices and confidence ranges) and the summary row.
    """
    if fit:
        model.fit(split.train, books)
    catalog = set(books.book_id)
    author_of = dict(zip(books.book_id, books.authors.str.split(",").str[0]))
    readers = split.train.user_id.nunique()
    counts = split.train.groupby("book_id").user_id.nunique()
    # a book nobody in training rated still gets a share of one reader, so novelty stays finite
    popularity = {b: max(counts.get(b, 0), 1) / readers for b in catalog}
    top100 = set(counts.sort_values(ascending=False).index[:100])

    rows, lists, disliked, read = [], [], 0, 0
    for case in split.cases:
        recs = list(model.recommend(case.history, k))
        check_guardrails(recs, set(case.history.book_id), catalog, k)
        lists.append(recs)
        d, r = m.regret_counts(recs, case.future, k)
        disliked, read = disliked + d, read + r
        rows.append({
            "user": case.user,
            "ndcg": m.ndcg(recs, case.targets, k),
            "hit_rate": m.hit_rate(recs, case.targets, k),
            "mrr": m.mrr(recs, case.targets, k),
            "recall": m.recall(recs, case.targets, k),
            "five_star": max(case.targets.values()) >= 5,
            "in_catalog": all(b in catalog for b in case.targets),
            "novelty": m.novelty(recs, popularity, k),
            "top100": np.mean([b in top100 for b in recs]),
            "author_spread": m.author_spread(recs, author_of, k),
        })
    per_reader = pd.DataFrame(rows)
    return {"per_reader": per_reader, "lists": lists,
            "summary": summarise(model.name, split.name, per_reader, lists, len(catalog),
                                 disliked, read, k)}


def summarise(model: str, run: str, per_reader: pd.DataFrame, lists: list, catalog_size: int,
              disliked: int, read: int, k: int = m.K) -> dict:
    row = {"model": model, "run": run, "readers": len(per_reader)}
    for col in ["ndcg", "hit_rate", "mrr", "recall"]:
        lo, hi = m.bootstrap_ci(per_reader[col])
        row[col], row[f"{col}_lo"], row[f"{col}_hi"] = per_reader[col].mean(), lo, hi
    row["ndcg_5star"] = per_reader.loc[per_reader.five_star, "ndcg"].mean()
    row["regret"] = disliked / read if read else float("nan")
    row["regret_n"] = read
    row["coverage"] = m.coverage(lists, catalog_size, k)
    row["novelty"] = per_reader.novelty.mean()
    row["top100_share"] = per_reader.top100.mean()
    row["author_spread"] = per_reader.author_spread.mean()
    return row


def slice_summary(result: dict, mask, run: str, model: str, catalog_size: int) -> dict:
    """The same grades for a subgroup of readers (e.g. the owner's books that are in goodbooks).
    Regret and coverage need the lists, so they're left out of slices."""
    per_reader = result["per_reader"][mask].reset_index(drop=True)
    lists = [l for l, keep in zip(result["lists"], mask) if keep]
    row = summarise(model, run, per_reader, lists, catalog_size, 0, 0)
    row["regret"], row["regret_n"] = float("nan"), 0
    return row
