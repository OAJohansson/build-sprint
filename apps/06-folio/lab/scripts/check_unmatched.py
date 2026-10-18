"""The hallucination check: of the books the LLM named that aren't in goodbooks' catalogue, how
many exist at all? Looks a fixed sample of them up on Open Library by title and author.

    uv run python scripts/check_unmatched.py      # after run_eval.py has run the LLM

A miss on Open Library is a strong hint the book is made up, not proof: very new or obscure
books can be missing too, so the misses are listed for a look by eye.
"""

import json
import random
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from folio_lab.results import RESULTS  # noqa: E402

PER_RUN = 60
HEADERS = {"User-Agent": "Folio lab (https://github.com/OAJohansson/build-sprint)"}


def _found(params: dict) -> bool:
    url = "https://openlibrary.org/search.json?" + urlencode({**params, "limit": 1, "fields": "key"})
    with urlopen(Request(url, headers=HEADERS), timeout=30) as res:
        return json.load(res)["numFound"] > 0


def exists(title: str, author: str) -> bool:
    """Short title (no subtitle or series) + author surname, then a free-text search. Full
    subtitles made Open Library miss real books (first run, 18 Oct)."""
    surname = author.split()[-1] if author.split() else author
    short = re.sub(r"\(.*?\)", "", title).split(":")[0].strip()
    return (_found({"title": short, "author": surname})
            or _found({"q": f"{short} {surname}"}))


def main() -> None:
    rows = [l.split("\t") for l in (RESULTS / "llm-unmatched.tsv").read_text().splitlines() if l]
    runs: dict = {}
    for model, run, title, author in rows:
        runs.setdefault((model, run), set()).add((title, author))
    lines = ["# Hallucination check", "",
             "Written by `scripts/check_unmatched.py`. Books the LLM named that aren't in the "
             f"catalogue, a random {PER_RUN} per run (seed 0), looked up on Open Library by title "
             "and author surname.", "",
             "| Model | Run | Not in catalogue | Checked | Found on Open Library | Not found |",
             "| --- | --- | ---: | ---: | ---: | ---: |"]
    missing = []
    for (model, run), names in sorted(runs.items()):
        sample = random.Random(0).sample(sorted(names), min(PER_RUN, len(names)))
        found = 0
        for title, author in sample:
            ok = exists(title, author)
            found += ok
            if not ok:
                missing.append(f"- {model}, {run}: *{title}* by {author}")
            time.sleep(0.5)  # Open Library asks for gentle use
        lines.append(f"| {model} | {run} | {len(names)} | {len(sample)} | {found} | "
                     f"{len(sample) - found} ({100 * (len(sample) - found) / max(len(sample), 1):.0f}%) |")
        print(lines[-1])
    lines += ["", "## Not found (check by eye: made up, or just missing from Open Library?)", "",
              *missing]
    (RESULTS / "llm-hallucination.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
