import pandas as pd
import pytest

from folio_lab.baselines import MostPopular, Random
from folio_lab.splits import leave_last_out, owner_cases, shelf_time

# reader 1 rates books 1..6 in this order; reader 2 is someone else
RATINGS = pd.DataFrame({
    "user_id": [1, 1, 2, 1, 1, 1, 1],
    "book_id": [1, 2, 9, 3, 4, 5, 6],
    "rating":  [5, 4, 5, 3, 5, 2, 4],
}).assign(seq=range(7))


def test_hide_last_liked_book_keeps_the_future_out_of_sight():
    split = leave_last_out(RATINGS, readers=[1], n_hidden=1)
    case = split.cases[0]
    assert case.targets == {6: 4}
    assert list(case.history.book_id) == [1, 2, 3, 4, 5]
    assert not set(split.train[split.train.user_id == 1].book_id) & set(case.targets)
    assert 9 in set(split.train.book_id)                     # other readers stay whole


def test_hide_last_two_liked_books_includes_the_dislike_between_them():
    split = leave_last_out(RATINGS, readers=[1], n_hidden=2)
    case = split.cases[0]
    assert case.targets == {4: 5, 6: 4}
    assert case.future == {4: 5, 5: 2, 6: 4}                 # 5 (2★) feeds the regret grade
    assert list(case.history.book_id) == [1, 2, 3]
    assert not set(split.train[split.train.user_id == 1].book_id) & set(case.future)


def shelf(rows):
    df = pd.DataFrame(rows, columns=["title", "shelf", "rating", "date_read", "date_added", "gb_id"])
    df["date_read"] = pd.to_datetime(df.date_read)
    df["date_added"] = pd.to_datetime(df.date_added)
    df["gb_id"] = df.gb_id.astype("Int64")
    return df


def test_missing_date_read_falls_back_to_date_added():
    s = shelf([("A", "read", 5, None, "2021-03-01", 1),
               ("B", "read", 4, "2022-05-14", "2021-01-01", 2),
               ("C", "to-read", None, None, "2023-01-31", 3)])
    assert list(shelf_time(s)) == list(pd.to_datetime(["2021-03-01", "2022-05-14", "2023-01-31"]))


def test_owner_sees_only_books_from_before_the_hidden_one():
    s = shelf([("Old", "read", 5, "2021-01-01", "2020-12-01", 1),
               ("Same day", "to-read", None, None, "2022-06-30", 2),
               ("Hidden", "read", 5, "2022-06-30", "2022-01-01", 3),
               ("Later", "to-read", None, None, "2022-07-01", 4)])
    hidden = next(c for c in owner_cases(s) if c.user == "Hidden")
    assert hidden.targets == {3: 5}
    assert list(hidden.history.book_id) == [1]               # same day and later stay hidden


def test_owner_three_star_books_are_not_targets_and_unmatched_books_still_count():
    s = shelf([("Meh", "read", 3, "2021-01-01", "2021-01-01", 1),
               ("Not in goodbooks", "read", 5, "2022-01-01", "2022-01-01", None)])
    cases = owner_cases(s)
    assert [c.user for c in cases] == ["Not in goodbooks"]
    assert None in cases[0].targets                          # a guaranteed miss in "all 48"


def test_empty_shelf_has_no_cases():
    assert owner_cases(shelf([])) == []


@pytest.mark.parametrize("model", [Random(), MostPopular()])
def test_baselines_never_recommend_the_shelf(model):
    books = pd.DataFrame({"book_id": range(1, 21), "authors": "x"})
    train = pd.DataFrame({"user_id": [1, 2, 3], "book_id": [1, 1, 2], "rating": [5, 5, 5]})
    model.fit(train, books)
    history = pd.DataFrame({"book_id": [1, 2, 3], "rating": [5, 4, None]})
    recs = model.recommend(history, 10)
    assert len(set(recs)) == 10 and not set(recs) & {1, 2, 3}
