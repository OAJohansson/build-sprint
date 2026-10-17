"""The results table: one row per model and run, rewritten in place when a run is repeated."""

from datetime import date
from pathlib import Path

import pandas as pd

RESULTS = Path(__file__).resolve().parent.parent / "results"


def record(rows: list[dict], step: str) -> pd.DataFrame:
    """Add or replace rows in results/results.csv, then rewrite results/results.md."""
    RESULTS.mkdir(exist_ok=True)
    path = RESULTS / "results.csv"
    new = pd.DataFrame(rows).assign(step=step, date=date.today().isoformat())
    if path.exists():
        old = pd.read_csv(path)
        keys = set(zip(new.model, new.run))
        old = old[[(m, r) not in keys for m, r in zip(old.model, old.run)]]
        new = pd.concat([old, new], ignore_index=True)
    new.to_csv(path, index=False, float_format="%.5g")
    (RESULTS / "results.md").write_text(markdown(new))
    return new


def _range(row, col, pct=False) -> str:
    f = (lambda x: f"{100 * x:.1f}%") if pct else (lambda x: f"{x:.3f}")
    if pd.isna(row[col]):
        return "–"
    if pd.isna(row.get(f"{col}_lo")):
        return f(row[col])
    return f"{f(row[col])} ({f(row[f'{col}_lo'])}–{f(row[f'{col}_hi'])})"


def markdown(table: pd.DataFrame) -> str:
    lines = [
        "# Folio recommender: results",
        "",
        "Written by `scripts/run_eval.py`; don't edit by hand. K = 10. Ranges are 95% bootstrap",
        "confidence intervals over readers. Headline: NDCG@10 on readers, hide last 1.",
        "",
        "| Step | Model | Run | Readers | NDCG@10 | Hit rate@10 | MRR | Recall@10 | NDCG 5★ | "
        "Regret | Coverage | Novelty | Top-100 share | Author spread |",
        "| --- | --- | --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for _, r in table.iterrows():
        regret = "–" if pd.isna(r.regret) else f"{100 * r.regret:.0f}% of {int(r.regret_n)}"
        lines.append(
            f"| {r.step} | {r.model} | {r.run} | {int(r.readers)} | {_range(r, 'ndcg')} | "
            f"{_range(r, 'hit_rate', True)} | {_range(r, 'mrr')} | {_range(r, 'recall', True)} | "
            f"{r.ndcg_5star:.3f} | {regret} | {100 * r.coverage:.1f}% | {r.novelty:.1f} | "
            f"{100 * r.top100_share:.0f}% | {r.author_spread:.2f} |"
        )
    return "\n".join(lines) + "\n"
