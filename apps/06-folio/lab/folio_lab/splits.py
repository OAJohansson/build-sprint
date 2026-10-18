"""Hide-and-seek: which books each reader's exam hides, and what the model may see.

A Case is one reader's exam. `history` is what the model sees (book_id, rating; NaN rating =
want-to-read), in order. `targets` are the hidden liked books (id -> stars). `future` is every
book the reader rated from the cut-off on, liked or not, for the regret grade.
"""

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

LIKED = 4  # owner, 17 Oct: 4–5★ is "a book I liked"; 3★ is decent, not a target


@dataclass
class Case:
    user: object
    history: pd.DataFrame
    targets: dict
    future: dict = field(default_factory=dict)


@dataclass
class Split:
    name: str
    train: pd.DataFrame   # every rating the model may learn from
    cases: list[Case]


def eligible_readers(ratings: pd.DataFrame, n: int = 10_000, min_liked: int = 10,
                     seed: int = 0) -> np.ndarray:
    """A fixed random sample of readers with at least `min_liked` liked books, so both runs
    (hide 1, hide 5) test the same people and every reader keeps a history to learn from."""
    liked = ratings[ratings.rating >= LIKED].groupby("user_id").size()
    pool = np.sort(liked[liked >= min_liked].index.to_numpy())
    rng = np.random.default_rng(seed)
    return np.sort(rng.choice(pool, size=min(n, len(pool)), replace=False))


def leave_last_out(ratings: pd.DataFrame, readers, n_hidden: int) -> Split:
    """Hide each reader's last `n_hidden` liked books, by order in the file (goodbooks' ratings
    are in time order). Everything from the first hidden book on is the reader's future: the
    model sees only the reader's past, and the future is removed from training. Other readers
    stay whole.

    shortcut: other readers' ratings are kept even when they happened after this reader's
    cut-off (standard leave-last-out, slightly optimistic); a global time split fixes that if
    numbers ever look too good to be true.
    """
    in_exam = ratings.user_id.isin(set(readers))
    exam = ratings[in_exam].sort_values(["user_id", "seq"])
    cases, future_rows = [], []
    for user, g in exam.groupby("user_id", sort=False):
        liked_at = np.flatnonzero(g.rating.to_numpy() >= LIKED)
        cut = liked_at[-n_hidden]
        past, future = g.iloc[:cut], g.iloc[cut:]
        hidden = future[future.rating >= LIKED]
        cases.append(Case(
            user=user,
            history=past[["book_id", "rating"]].reset_index(drop=True),
            targets=dict(zip(hidden.book_id, hidden.rating)),
            future=dict(zip(future.book_id, future.rating)),
        ))
        future_rows.append(future.index)
    train = ratings.drop(index=np.concatenate(future_rows))
    return Split(f"readers, hide last {n_hidden}", train, cases)


def shelf_time(shelf: pd.DataFrame) -> pd.Series:
    """When each book joined what Folio knew: date read for read books (date added when it's
    missing, as for 19 of the owner's 65), date added for want-to-reads."""
    read_on = shelf.date_read.where(shelf.shelf == "read")
    return read_on.fillna(shelf.date_added)


def owner_cases(shelf: pd.DataFrame, id_col: str = "gb_id") -> list[Case]:
    """The owner's personal check: each liked book in turn is hidden, and the model sees only the
    shelf as it stood *before* that book (strictly earlier, so same-day additions stay hidden:
    no Thursday's newspaper). Books not in goodbooks can't be seen or found; their target is
    kept as None so the "all 48" slice counts them as misses.

    With id_col="eval_id" (from data.add_shelf_books) every shelf book has an id, so a model
    that knows books beyond goodbooks (the LLM) can see and find all of them."""
    shelf = shelf.assign(t=shelf_time(shelf), gb_id=shelf[id_col])
    cases = []
    for book in shelf[(shelf.shelf == "read") & (shelf.rating >= LIKED)].itertuples():
        before = shelf[(shelf.t < book.t) & shelf.gb_id.notna()].sort_values("t")
        after = shelf[(shelf.t >= book.t) & (shelf.shelf == "read") & shelf.gb_id.notna()
                      & shelf.rating.notna()]
        cases.append(Case(
            user=book.title,
            history=pd.DataFrame({"book_id": before.gb_id.astype(int).to_numpy(),
                                  "rating": before.rating.to_numpy()}),
            targets={int(book.gb_id): book.rating} if pd.notna(book.gb_id) else {None: book.rating},
            future=dict(zip(after.gb_id.astype(int), after.rating)),
        ))
    return cases
