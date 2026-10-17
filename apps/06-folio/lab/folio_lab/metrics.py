"""Grades for one list of recommendations, and for all lists together.

`recs` is a ranked list of book ids (best first). `targets` maps each hidden book the reader
liked to its star rating; `gain` turns a rating into points (4★ = 1, 4.5★ = 1.5, 5★ = 2).
"""

import math
from collections.abc import Iterable, Mapping

import numpy as np

K = 10


def gain(rating: float) -> float:
    """Points for finding a liked book: 4★ = 1, 5★ = 2 (the owner's "skewed to 5★")."""
    return rating - 3


def hit_rate(recs: list, targets: Mapping, k: int = K) -> float:
    """1 if any hidden book is in the top k, else 0."""
    return float(any(b in targets for b in recs[:k]))


def recall(recs: list, targets: Mapping, k: int = K) -> float:
    """Share of the hidden books that are in the top k."""
    if not targets:
        return 0.0
    return sum(b in targets for b in recs[:k]) / len(targets)


def mrr(recs: list, targets: Mapping, k: int = K) -> float:
    """One over the position of the first hit (1, 1/2, 1/3 …), 0 if none."""
    for i, b in enumerate(recs[:k]):
        if b in targets:
            return 1 / (i + 1)
    return 0.0


def ndcg(recs: list, targets: Mapping, k: int = K) -> float:
    """Points for each hit (gain), less the lower it sits (discount 1/log2(position + 1)),
    divided by the best score possible for these hidden books (normalised, so 0 to 1)."""
    if not targets:
        return 0.0
    dcg = sum(gain(targets[b]) / math.log2(i + 2) for i, b in enumerate(recs[:k]) if b in targets)
    best = sorted((gain(r) for r in targets.values()), reverse=True)[:k]
    idcg = sum(g / math.log2(i + 2) for i, g in enumerate(best))
    return dcg / idcg


def regret_counts(recs: list, future: Mapping, k: int = K) -> tuple[int, int]:
    """(recommended books the reader later rated 3★ or lower, recommended books they later rated
    at all). The grade is the first over the second, summed over readers: "of the picks people
    went on to read, how many disappointed?" Counting dislikes alone would reward a model for
    recommending books nobody reads."""
    read = [future[b] for b in recs[:k] if b in future]
    return sum(r <= 3 for r in read), len(read)


def author_spread(recs: list, author_of: Mapping, k: int = K) -> float:
    """Distinct first authors in the top k over the list length (1 = all different)."""
    top = recs[:k]
    if not top:
        return 0.0
    return len({author_of.get(b) for b in top}) / len(top)


def coverage(lists: Iterable[list], catalog_size: int, k: int = K) -> float:
    """Share of the catalog that appears in at least one reader's top k."""
    seen = set()
    for recs in lists:
        seen.update(recs[:k])
    return len(seen) / catalog_size


def novelty(recs: list, popularity: Mapping, k: int = K) -> float:
    """Mean surprise of the picks, -log2(share of readers who rated the book): about 1 for a
    book half of readers rated, about 13 for one in 10,000. Higher = less mainstream."""
    top = recs[:k]
    if not top:
        return 0.0
    return float(np.mean([-math.log2(popularity[b]) for b in top]))


def bootstrap_ci(values, n: int = 1000, seed: int = 0) -> tuple[float, float]:
    """95% range for the mean: resample the readers with replacement n times."""
    values = np.asarray(values, dtype=float)
    if len(values) == 0:
        return (float("nan"), float("nan"))
    rng = np.random.default_rng(seed)
    means = values[rng.integers(0, len(values), (n, len(values)))].mean(axis=1)
    return float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))
