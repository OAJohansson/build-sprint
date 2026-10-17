"""Score the models on both levels and update results/. Run from the lab folder:

    uv run python scripts/run_eval.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from folio_lab.baselines import MostPopular, Random  # noqa: E402
from folio_lab.data import load_books, load_ratings, load_shelf, match_to_goodbooks  # noqa: E402
from folio_lab.evaluate import evaluate, slice_summary  # noqa: E402
from folio_lab.results import record  # noqa: E402
from folio_lab.splits import Split, eligible_readers, leave_last_out, owner_cases  # noqa: E402

STEP = "1 baselines"
MODELS = [Random, MostPopular]


def main() -> None:
    books, ratings = load_books(), load_ratings()
    readers = eligible_readers(ratings)
    splits = [leave_last_out(ratings, readers, 1), leave_last_out(ratings, readers, 5)]
    shelf = match_to_goodbooks(load_shelf(), books)
    owner = Split("you, all 48 liked", ratings, owner_cases(shelf))

    rows = []
    for make in MODELS:
        for split in splits:
            result = evaluate(make(), split, books)
            if split.name.endswith("last 1"):
                # after the last liked book every rating is 3★ or lower by definition, so
                # regret is only meaningful in the hide-5 run
                result["summary"]["regret"], result["summary"]["regret_n"] = float("nan"), 0
            rows.append(result["summary"])
            print(f"{make.name:>13} | {split.name}: NDCG@10 {result['summary']['ndcg']:.4f}")
        result = evaluate(make(), owner, books)
        rows.append(result["summary"])
        in_gb = result["per_reader"].in_catalog.to_numpy()
        rows.append(slice_summary(result, in_gb, f"you, the {in_gb.sum()} in goodbooks",
                                  make.name, len(books)))
        hits = result["per_reader"].hit_rate.sum()
        print(f"{make.name:>13} | you: {hits:.0f} of {len(owner.cases)} found")
    record(rows, STEP)


if __name__ == "__main__":
    main()
