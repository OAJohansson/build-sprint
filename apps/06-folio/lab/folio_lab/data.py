"""Load the owner's Goodreads shelf and goodbooks-10k, and match one to the other."""

import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "data"
GOODBOOKS = DATA / "goodbooks"


def _clean_isbn(value) -> str | None:
    """Goodreads writes ISBNs as ="0140135154"; keep the digits (and a final X)."""
    if pd.isna(value):
        return None
    digits = re.sub(r"[^0-9Xx]", "", str(value)).upper()
    return digits or None


def load_shelf(path: Path = DATA / "goodreads_library_export.csv",
               corrections: Path = DATA / "corrections.json") -> pd.DataFrame:
    """The owner's shelf, one row per book, with corrections.json applied.

    Columns: book_id, title, author, isbn, isbn13, rating (None = unrated), shelf
    ("read" or "to-read"), date_read, date_added.
    """
    raw = pd.read_csv(path, dtype={"Book Id": str})
    shelf = pd.DataFrame({
        "book_id": raw["Book Id"],
        "title": raw["Title"],
        "author": raw["Author"].str.replace(r"\s+", " ", regex=True).str.strip(),
        "isbn": raw["ISBN"].map(_clean_isbn),
        "isbn13": raw["ISBN13"].map(_clean_isbn),
        # Goodreads writes 0 for "not rated", never for zero stars
        "rating": raw["My Rating"].where(raw["My Rating"] > 0),
        "shelf": raw["Exclusive Shelf"],
        "date_read": pd.to_datetime(raw["Date Read"], format="%Y/%m/%d"),
        "date_added": pd.to_datetime(raw["Date Added"], format="%Y/%m/%d"),
    })
    for fix in json.loads(corrections.read_text())["merge"]:
        shelf = shelf[shelf.book_id != fix["drop"]]
        if "rating" in fix:
            shelf.loc[shelf.book_id == fix["keep"], "rating"] = fix["rating"]
    return shelf.reset_index(drop=True)


def load_books() -> pd.DataFrame:
    """goodbooks-10k's book table. isbn13 is unusable (stored as a rounded float)."""
    books = pd.read_csv(GOODBOOKS / "books.csv", dtype={"isbn": str})
    # the CSV dropped leading zeros from ISBN-10s
    books["isbn"] = books["isbn"].str.zfill(10)
    return books


def load_ratings() -> pd.DataFrame:
    """6M (user_id, book_id, rating) rows; book_id is goodbooks' own 1–10000 id.

    The file is in time order (README, and checked: no 2016–17 book is rated before row 1.1M),
    so `seq`, the row number, is each rating's place in time.
    """
    ratings = pd.read_csv(GOODBOOKS / "ratings.csv")
    return ratings.assign(seq=range(len(ratings)))


def _norm_title(title: str) -> str:
    """'Sapiens: A Brief History of Humankind' and 'Sapiens (Penguin ed.)' -> 'sapiens'."""
    t = str(title).lower()
    t = re.sub(r"\(.*?\)", "", t)          # series or edition in brackets
    t = t.split(":")[0]                     # subtitle
    t = re.sub(r"^(the|a|an) ", "", t.strip())
    return re.sub(r"[^a-z0-9]", "", t)


def _surname(author: str) -> str:
    return re.sub(r"[^a-z]", "", str(author).split(",")[0].split()[-1].lower())


def match_to_goodbooks(shelf: pd.DataFrame, books: pd.DataFrame) -> pd.DataFrame:
    """Add gb_id (goodbooks book_id or NA) and how it matched, strictest rule first.

    1. Same Goodreads id (the edition, or goodbooks' "best" edition)
    2. Same ISBN-10
    3. Same normalised title and author surname (catches other editions)
    """
    by_gr = {**dict(zip(books.best_book_id.astype(str), books.book_id)),
             **dict(zip(books.goodreads_book_id.astype(str), books.book_id))}
    by_isbn = dict(zip(books.isbn.dropna(), books.book_id))
    first_author = books.authors.str.split(",").str[0]
    by_title = {}
    for gb_id, title, author in zip(books.book_id, books.title, first_author):
        by_title.setdefault((_norm_title(title), _surname(author)), gb_id)

    ids, how = [], []
    for row in shelf.itertuples():
        if row.book_id in by_gr:
            ids.append(by_gr[row.book_id]); how.append("goodreads id")
        elif row.isbn and row.isbn in by_isbn:
            ids.append(by_isbn[row.isbn]); how.append("isbn")
        elif (key := (_norm_title(row.title), _surname(row.author))) in by_title:
            ids.append(by_title[key]); how.append("title + author")
        else:
            ids.append(pd.NA); how.append(None)
    return shelf.assign(gb_id=pd.array(ids, dtype="Int64"), matched_by=how)


FIRST_EXTRA_ID = 100_001


def add_shelf_books(books: pd.DataFrame, shelf: pd.DataFrame):
    """The catalogue plus the owner's books that goodbooks lacks (ids from 100,001), and the
    shelf with `eval_id` (goodbooks id, else the new id). Only models that read titles (the
    LLM) can use the new books; the others never see them."""
    extra = shelf[shelf.gb_id.isna()].reset_index(drop=True)
    ids = np.arange(FIRST_EXTRA_ID, FIRST_EXTRA_ID + len(extra))
    new = pd.DataFrame({"book_id": ids, "title": extra.title, "authors": extra.author})
    eval_id = shelf.gb_id.astype("Int64").copy()
    eval_id[shelf.gb_id.isna().to_numpy()] = ids
    return pd.concat([books, new], ignore_index=True), shelf.assign(eval_id=eval_id)
