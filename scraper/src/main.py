from datetime import datetime, timezone
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

            if product_url not in [item["product_url"] for item in discovered]:
                discovered.append(
                    {
                        "product_url": product_url,
                        "source_page": page_url,
                    }
                )

    return discovered


def cache_detail_page(product_url, index):
    detail_cache_dir = CACHE_DIR / "details"
    detail_cache_dir.mkdir(parents=True, exist_ok=True)

    cache_file = detail_cache_dir / f"book-{index:03d}.html"

    if cache_file.exists():
        print(f"Cache hit: {cache_file}")
        return cache_file.read_text(encoding="utf-8")

    sleep(REQUEST_DELAY_SECONDS)

    html = fetch_url(product_url)

    cache_file.write_text(html, encoding="utf-8")

    print(f"Fetched: {product_url}")
    print(f"Cached: {cache_file}")

    return html


def extract_book_details(html, product_url, source_page):
    soup = BeautifulSoup(html, "html.parser")

    title_element = soup.select_one("div.product_main h1")
    price_element = soup.select_one("div.product_main p.price_color")
    availability_element = soup.select_one(
        "div.product_main p.instock.availability"
    )
    rating_element = soup.select_one("div.product_main p.star-rating")
    description_element = soup.select_one(
        "#product_description + p"
    )

    rating_text = None
    if rating_element is not None:
        rating_classes = rating_element.get("class", [])
        if len(rating_classes) >= 2:
            rating_text = rating_classes[1]

    description = None
    if description_element is not None:
        description = description_element.get_text(
            " ",
            strip=True,
        )

    return {
        "title": (
            title_element.get_text(strip=True)
            if title_element is not None
            else None
        ),
        "product_url": product_url,
        "price_text": (
            price_element.get_text(strip=True)
            if price_element is not None
            else None
        ),
        "availability_text": (
            availability_element.get_text(" ", strip=True)
            if availability_element is not None
            else None
        ),
        "rating_text": rating_text,
        "description": description,
        "source_page": source_page,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    html = fetch_catalogue_page()

    catalogue_pages = discover_catalogue_pages(html)
    print(f"catalogue_pages={len(catalogue_pages)}")

    for page in catalogue_pages:
        print(page)

    book_urls = discover_book_urls(catalogue_pages)

    print(f"discovered={len(book_urls)}")
    print(
        f"unique_urls={len({item['product_url'] for item in book_urls})}"
    )

    raw_records = []

    for index, book in enumerate(book_urls, start=1):
        detail_html = cache_detail_page(
            book["product_url"],
            index,
        )

        raw_record = extract_book_details(
            detail_html,
            book["product_url"],
            book["source_page"],
        )

        raw_records.append(raw_record)

    print(f"detail_pages={len(raw_records)}")
    print("first_raw_record=")
    print(raw_records[0])


if __name__ == "__main__":
    main()
