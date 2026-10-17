"""Download goodbooks-10k (Zajac, 2017) into data/goodbooks/. Not committed (decision 0012).

Run from the lab folder: uv run python scripts/download_goodbooks.py
"""

from pathlib import Path
from urllib.request import urlretrieve

BASE = "https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/"
FILES = ["books.csv", "ratings.csv", "to_read.csv", "tags.csv", "book_tags.csv"]
OUT = Path(__file__).resolve().parent.parent / "data" / "goodbooks"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        target = OUT / name
        if target.exists():
            print(f"have {name}")
            continue
        print(f"downloading {name} ...")
        urlretrieve(BASE + name, target)
    print(f"done: {OUT}")


if __name__ == "__main__":
    main()
