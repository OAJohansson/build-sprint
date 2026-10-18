"""Content-based recommenders: describe every book as a list of numbers, describe the reader as a
weighted blend of the books on their shelf, recommend the books closest to that blend.

Step 2 (decision 0017's bar). The models differ only in how a book becomes numbers:
TF-IDF on Goodreads shelf tags first, sentence embeddings later.
"""

import re

import numpy as np
import pandas as pd
from scipy import sparse

from .data import GOODBOOKS

# Shelf names that say how someone holds or files a book, not what's in it. Matched against
# the whole tag. Built by reading the 300 most common tags (step 2 journal).
GENERIC = re.compile(r"""^(
    .*to-?read.* | .*currently.* | .*favou?rite.* | .*fav | .*faves? | .*library.*
   | own | .*-own | own-.* | .*owned.* | .*kindle.* | .*e-?books?.* | .*audio.* | .*audible.* | .*nook.* | .*ipad.* | .*pdf.*
  | .*wish.* | .*to-?buy.* | .*buy.* | default | books? | my-.* | .*shelf.* | .*shelfari.*
  | (read|re-read|reread|read-in|read-again|reading|finished|unfinished|abandoned|dnf)(-.*)?
  | .*did-not-finish.* | .*not-finished.* | .*gave-up.* | .*borrowed.* | .*\d{4}.*
  | .*\d-stars?.* | .*stars?.* | maybe | have | book-club | bookclub | .*challenge.*
  | i-own | gift.* | .*on-hold.* | .*tbr.* | .*want.* | .*loved.* | .*recommended.*
  | .*must-read.* | .*best.* | .*my-.* | .*re-?read.* | .*paperback.* | .*hardcover.*
  | .*physical.* | .*sold.* | .*donated.* | .*for-class.* | .*school-reading.*
  | reviewed | calibre | .*didn-t-finish.* | .*couldn-t-finish.* | .*never-finished.* | unread
  | books-i-have | listened-to | mine | overdrive | arc | first-reads | favs | to-get | bought
  | purchased | scanned | netgalley | meh | signed | other | general | home | 1 | botm | .*recommend.*
)$""", re.VERBOSE)


def is_generic(tag: str) -> bool:
    return bool(GENERIC.match(tag))


def load_book_tags(books: pd.DataFrame) -> pd.DataFrame:
    """(book_id, tag, count) for goodbooks' own book ids. Counts are how many Goodreads users
    put the book on a shelf with that name (top 100 shelves per book, 2017 snapshot)."""
    tags = pd.read_csv(GOODBOOKS / "tags.csv")
    bt = pd.read_csv(GOODBOOKS / "book_tags.csv").merge(tags, on="tag_id")
    gb = books.dropna(subset=["goodreads_book_id"])
    to_book = dict(zip(gb.goodreads_book_id.astype(int), gb.book_id))
    bt["book_id"] = bt.goodreads_book_id.map(to_book)
    bt = bt[bt["count"] > 0]
    return bt.groupby(["book_id", "tag_name"], as_index=False)["count"].sum().rename(
        columns={"tag_name": "tag"})


def tfidf_matrix(book_tags: pd.DataFrame, book_ids: np.ndarray, min_books: int = 3,
                 drop_generic: bool = True) -> tuple[sparse.csr_matrix, np.ndarray]:
    """Rows = books (in `book_ids` order), columns = tags, each row of length 1.

    TF = 1 + log(count): a tag 10,000 readers used beats one 10 used, but not by 1,000×.
    IDF = log(books / books with the tag): a tag on every book says nothing about any.
    """
    bt = book_tags
    if drop_generic:
        bt = bt[~bt.tag.map(is_generic)]
    spread = bt.groupby("tag").book_id.nunique()
    bt = bt[bt.tag.isin(spread[spread >= min_books].index)]
    vocab = np.sort(bt.tag.unique())
    col = pd.Series(np.arange(len(vocab)), index=vocab)
    row = pd.Series(np.arange(len(book_ids)), index=book_ids)
    tf = 1 + np.log(bt["count"].to_numpy())
    idf = np.log(len(book_ids) / spread.reindex(vocab).to_numpy())
    x = sparse.csr_matrix((tf * idf[col[bt.tag].to_numpy()],
                           (row[bt.book_id].to_numpy(), col[bt.tag].to_numpy())),
                          shape=(len(book_ids), len(vocab)))
    return _unit_rows(x), vocab


def _unit_rows(x):
    if sparse.issparse(x):
        norms = np.sqrt(np.asarray(x.multiply(x).sum(axis=1)).ravel())
        norms[norms == 0] = 1
        return sparse.diags(1 / norms) @ x
    norms = np.linalg.norm(x, axis=1, keepdims=True)
    norms[norms == 0] = 1
    return x / norms


class ContentModel:
    """Shared by every content model: subclasses only build `self.vectors` (one row per book).

    The reader's taste = a weighted sum of the vectors of the books on their shelf. Weights
    (owner's calls, step 2): stars → weight, want-to-read → weight, and an optional fade so
    recent books count more (half-life in books: the 10th most recent counts half as much
    as the latest when half_life = 10).
    """

    name = "content"

    def __init__(self, weights: dict | None = None, want: float = 0.0,
                 half_life: float | None = None, name: str | None = None):
        if name:
            self.name = name
        self.weights = weights or {5: 2.0, 4: 1.0, 3: 0.0, 2: -1.0, 1: -1.0}
        self.want = want
        self.half_life = half_life

    def build_vectors(self, books: pd.DataFrame):
        raise NotImplementedError

    def fit(self, train: pd.DataFrame, books: pd.DataFrame) -> None:
        if getattr(self, "_books_key", None) != len(books):
            # vectors depend only on the books, not the readers: build once, reuse per split
            self.book_ids = books.book_id.to_numpy()
            self.vectors = self.build_vectors(books)
            self.row_of = pd.Series(np.arange(len(self.book_ids)), index=self.book_ids)
            self._books_key = len(books)
        # for readers with nothing to go on yet (the owner's first liked book)
        counts = train.groupby("book_id").size().reindex(self.book_ids, fill_value=0)
        self.fallback = self.book_ids[np.argsort(-counts.to_numpy(), kind="stable")]

    def reader_weights(self, history: pd.DataFrame) -> np.ndarray:
        r = history.rating.to_numpy(dtype=float)
        w = np.array([self.want if np.isnan(x) else self.weights.get(round(x), 0.0) for x in r])
        if self.half_life and len(w):
            age = np.arange(len(w))[::-1]  # history is oldest first: the latest book has age 0
            w = w * 0.5 ** (age / self.half_life)
        return w

    def scores(self, history: pd.DataFrame) -> np.ndarray | None:
        known = history[history.book_id.isin(self.row_of.index)]
        w = self.reader_weights(known)
        if not np.any(w > 0):
            return None
        rows = self.row_of[known.book_id].to_numpy()
        taste = self.vectors[rows].T @ w           # the reader as one vector
        s = self.vectors @ taste
        return np.asarray(s).ravel()

    def recommend(self, history: pd.DataFrame, k: int) -> list[int]:
        shelf = set(history.book_id)
        s = self.scores(history)
        if s is None:
            ranked = self.fallback
        else:
            top = np.argpartition(-s, k + len(shelf))[: k + len(shelf)]
            ranked = self.book_ids[top[np.argsort(-s[top], kind="stable")]]
        return [int(b) for b in ranked if b not in shelf][:k]

    def similar(self, book_id: int, k: int = 10) -> list[tuple[int, float]]:
        """The k books closest to one book: for reading the model with your own eyes."""
        v = self.vectors[self.row_of[book_id]]
        s = (self.vectors @ v.T).toarray().ravel() if sparse.issparse(v) else self.vectors @ v
        top = np.argsort(-s)[1: k + 1]
        return [(int(self.book_ids[i]), float(s[i])) for i in top]


class TfidfTags(ContentModel):
    """Books as TF-IDF vectors over the shelf names Goodreads users gave them, generic shelves
    ("to-read", "owned", "favorites", "kindle") dropped."""

    name = "tf-idf tags"

    def __init__(self, min_books: int = 3, drop_generic: bool = True, **kw):
        super().__init__(**kw)
        self.min_books, self.drop_generic = min_books, drop_generic

    def build_vectors(self, books):
        x, self.vocab = tfidf_matrix(load_book_tags(books), books.book_id.to_numpy(),
                                     self.min_books, self.drop_generic)
        return x
