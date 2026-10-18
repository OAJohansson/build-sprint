"""The two deliberately dumb assistants: the floor (random) and the bar (bestsellers)."""

import numpy as np
import pandas as pd


class Random:
    """10 books out of a hat, skipping what's on the shelf. Fixed seed, so reruns match."""

    name = "random"

    def __init__(self, seed: int = 0):
        self.seed = seed

    def fit(self, train: pd.DataFrame, books: pd.DataFrame) -> None:
        self.catalog = books.book_id.to_numpy()
        self.rng = np.random.default_rng(self.seed)

    def recommend(self, history: pd.DataFrame, k: int) -> list[int]:
        shelf = set(history.book_id)
        picks: list[int] = []
        while len(picks) < k:
            for b in self.rng.choice(self.catalog, size=2 * k, replace=False):
                if b not in shelf and b not in picks and len(picks) < k:
                    picks.append(int(b))
        return picks


class MostPopular:
    """The books the most readers rated, minus what's on the shelf. Same list for everyone."""

    name = "most popular"

    def fit(self, train: pd.DataFrame, books: pd.DataFrame) -> None:
        counts = train.groupby("book_id").size().reindex(books.book_id, fill_value=0)
        # stable sort: books nobody rated come last, so a list can always be filled
        self.ranked = counts.sort_values(ascending=False, kind="stable").index.to_numpy()

    def recommend(self, history: pd.DataFrame, k: int) -> list[int]:
        shelf = set(history.book_id)
        picks = []
        for b in self.ranked:
            if b not in shelf:
                picks.append(int(b))
                if len(picks) == k:
                    break
        return picks
