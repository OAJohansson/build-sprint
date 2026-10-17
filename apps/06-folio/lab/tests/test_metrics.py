import math

import pytest

from folio_lab import metrics as m
from folio_lab.evaluate import GuardrailError, check_guardrails

TEN = list(range(1, 11))  # a list of 10 recommended book ids, best first


# Hit at rank 1, hit at rank 10, no hit, empty list: for each grade.

@pytest.mark.parametrize("recs, targets, hit, rr, nd", [
    (TEN, {1: 5}, 1, 1.0, 1.0),                              # hit at rank 1
    (TEN, {10: 5}, 1, 0.1, 1 / math.log2(11)),               # hit at rank 10: 0.289
    (TEN, {99: 5}, 0, 0.0, 0.0),                             # no hit
    ([], {1: 5}, 0, 0.0, 0.0),                               # empty list
])
def test_single_hidden_book(recs, targets, hit, rr, nd):
    assert m.hit_rate(recs, targets) == hit
    assert m.mrr(recs, targets) == pytest.approx(rr)
    assert m.ndcg(recs, targets) == pytest.approx(nd)
    assert m.recall(recs, targets) == hit


def test_rank_3_matches_the_table_shown_to_the_owner():
    assert m.ndcg(TEN, {3: 4}) == pytest.approx(0.5)
    assert m.mrr(TEN, {3: 4}) == pytest.approx(1 / 3)


def test_book_at_rank_11_is_a_miss():
    assert m.hit_rate(list(range(1, 12)), {11: 5}) == 0


def test_one_hidden_book_scores_the_same_whatever_its_stars():
    # normalised: the best possible list for this one book also scores its gain at rank 1
    assert m.ndcg(TEN, {2: 4}) == pytest.approx(m.ndcg(TEN, {2: 5}))


def test_five_star_books_found_beat_four_star_books_found():
    hidden = {1: 5, 2: 5, 50: 4, 51: 4, 52: 4}
    found_the_5s = [1, 2] + list(range(100, 108))
    found_two_4s = [50, 51] + list(range(100, 108))
    assert m.ndcg(found_the_5s, hidden) > m.ndcg(found_two_4s, hidden)
    assert m.recall(found_the_5s, hidden) == m.recall(found_two_4s, hidden) == 0.4


def test_ndcg_hand_worked_with_two_hidden():
    # hits at ranks 1 (5★, gain 2) and 3 (4★, gain 1): DCG = 2/1 + 1/2 = 2.5
    # best: 5★ at 1, 4★ at 2: IDCG = 2 + 1/log2(3) = 2.631
    assert m.ndcg(TEN, {1: 5, 3: 4}) == pytest.approx(2.5 / (2 + 1 / math.log2(3)))


def test_no_hidden_books_scores_zero_not_an_error():
    assert m.ndcg(TEN, {}) == 0 and m.recall(TEN, {}) == 0


def test_regret_counts_only_books_the_reader_went_on_to_rate():
    future = {1: 5, 2: 3, 3: 2, 77: 1}          # 77 not recommended, so it doesn't count
    assert m.regret_counts(TEN, future) == (2, 3)
    assert m.regret_counts([], future) == (0, 0)


def test_author_spread():
    authors = {1: "Tolkien", 2: "Tolkien", 3: "Miller", 4: "Frankl"}
    assert m.author_spread([1, 2, 3, 4], authors) == 0.75
    assert m.author_spread([], authors) == 0


def test_coverage():
    assert m.coverage([[1, 2], [2, 3]], catalog_size=10) == 0.3


def test_novelty_higher_for_rarer_books():
    pop = {1: 0.5, 2: 1 / 1024}
    assert m.novelty([1], pop) == pytest.approx(1)
    assert m.novelty([2], pop) == pytest.approx(10)


def test_bootstrap_range_contains_the_mean_and_narrows_with_more_readers():
    few = [0, 1] * 5
    many = [0, 1] * 5000
    lo, hi = m.bootstrap_ci(few)
    assert lo <= 0.5 <= hi
    lo2, hi2 = m.bootstrap_ci(many)
    assert hi2 - lo2 < hi - lo


# Guardrails

CATALOG = set(range(1, 100))


def test_guardrails_pass_a_clean_list():
    check_guardrails(TEN, history_ids={50}, catalog=CATALOG, k=10)


@pytest.mark.parametrize("recs, shelf, why", [
    (TEN[:9], set(), "expected 10"),
    (TEN[:9] + [1], set(), "twice"),
    (TEN[:9] + [12345], set(), "don't exist"),
    (TEN, {3}, "already on"),
])
def test_guardrails_fail_loudly(recs, shelf, why):
    with pytest.raises(GuardrailError, match=why):
        check_guardrails(recs, history_ids=shelf, catalog=CATALOG, k=10)
