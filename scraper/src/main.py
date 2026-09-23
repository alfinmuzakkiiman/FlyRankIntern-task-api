from pathlib import Path

import requests


BASE_URL = "https://books.toscrape.com/"
CACHE_DIR = Path(__file__).resolve().parents[1] / "cache"
CACHE_FILE = CACHE_DIR / "catalogue-page-1.html"

USER_AGENT = "FlyRank-PoliteScraper/1.0 (+https://github.com/alfinmuzakkiiman/FlyRankIntern-task-api)"
TIMEOUT_SECONDS = 10


def fetch_catalogue_page():
    if CACHE_FILE.exists():
        print(f"Cache hit: {CACHE_FILE}")
        return CACHE_FILE.read_text(encoding="utf-8")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    headers = {
        "User-Agent": USER_AGENT,
    }

    response = requests.get(
        BASE_URL,
        headers=headers,
        timeout=TIMEOUT_SECONDS,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Expected HTTP 200, got {response.status_code}"
        )

    CACHE_FILE.write_text(response.text, encoding="utf-8")

    print(f"Fetched: {BASE_URL}")
    print(f"Cached: {CACHE_FILE}")

    return response.text


def main():
    fetch_catalogue_page()


if __name__ == "__main__":
    main()
