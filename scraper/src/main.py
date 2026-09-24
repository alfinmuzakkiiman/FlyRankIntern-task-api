from pathlib import Path
from time import sleep
from urllib.parse import urljoin

from bs4 import BeautifulSoup
import requests


BASE_URL = "https://books.toscrape.com/"
CACHE_DIR = Path(__file__).resolve().parents[1] / "cache"
CACHE_FILE = CACHE_DIR / "catalogue-page-1.html"

USER_AGENT = "FlyRank-PoliteScraper/1.0 (+https://github.com/alfinmuzakkiiman/FlyRankIntern-task-api)"
TIMEOUT_SECONDS = 10
REQUEST_DELAY_SECONDS = 0.5


def fetch_url(url):
    headers = {
        "User-Agent": USER_AGENT,
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=TIMEOUT_SECONDS,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Expected HTTP 200, got {response.status_code}"
        )

    return response.text


def fetch_catalogue_page():
    if CACHE_FILE.exists():
        print(f"Cache hit: {CACHE_FILE}")
        return CACHE_FILE.read_text(encoding="utf-8")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    html = fetch_url(BASE_URL)

    CACHE_FILE.write_text(html, encoding="utf-8")

    print(f"Fetched: {BASE_URL}")
    print(f"Cached: {CACHE_FILE}")

    return html


def discover_catalogue_pages(html):
    pages = []
    current_url = BASE_URL
    current_html = html

    while current_url and len(pages) < 3:
        if current_url not in pages:
            pages.append(current_url)

        soup = BeautifulSoup(current_html, "html.parser")
        next_link = soup.select_one("li.next a")

        if next_link is None:
            break

        href = next_link.get("href")
        if not href:
            break

        next_url = urljoin(current_url, href)

        if next_url in pages:
            break

        sleep(REQUEST_DELAY_SECONDS)

        current_url = next_url
        current_html = fetch_url(current_url)

    return pages


def discover_book_urls(catalogue_pages):
    discovered = []

    for index, page_url in enumerate(catalogue_pages):
        if index > 0:
            sleep(REQUEST_DELAY_SECONDS)

        html = fetch_url(page_url)
        soup = BeautifulSoup(html, "html.parser")

        for article in soup.select("article.product_pod"):
            link = article.select_one("h3 a")

            if link is None:
                continue

            href = link.get("href")

            if not href:
                continue

            product_url = urljoin(page_url, href)

            if product_url not in discovered:
                discovered.append(product_url)

    return discovered


def main():
    html = fetch_catalogue_page()

    catalogue_pages = discover_catalogue_pages(html)
    print(f"catalogue_pages={len(catalogue_pages)}")

    for page in catalogue_pages:
        print(page)

    book_urls = discover_book_urls(catalogue_pages)

    print(f"discovered={len(book_urls)}")
    print(f"unique_urls={len(set(book_urls))}")


if __name__ == "__main__":
    main()
