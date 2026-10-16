
import sys
import unittest
from pathlib import Path

# Tambahkan folder src agar main.py bisa diimpor oleh test.
SRC_DIR = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_DIR))

from main import normalize_price, discover_book_urls
from main import extract_book_details
from urllib.parse import urljoin
from bs4 import BeautifulSoup


class TestPriceNormalization(unittest.TestCase):
    def test_pound_price_becomes_number(self):
        result = normalize_price("£51.77")
        self.assertEqual(result, 51.77)



from unittest.mock import patch


class TestDuplicateBookUrls(unittest.TestCase):
    @patch("main.fetch_url")
    def test_duplicate_urls_are_removed(self, mock_fetch):
        html = """
        <html><body>
          <article class="product_pod">
            <h3><a href="catalogue/book-one_1/index.html">Book One</a></h3>
          </article>
          <article class="product_pod">
            <h3><a href="catalogue/book-one_1/index.html">Book One Again</a></h3>
          </article>
        </body></html>
        """
        mock_fetch.return_value = html

        result = discover_book_urls(["https://books.toscrape.com/"])

        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0]["product_url"],
            "https://books.toscrape.com/catalogue/book-one_1/index.html",
        )


class TestRelativeUrl(unittest.TestCase):
    @patch("main.fetch_url")
    def test_relative_url_becomes_absolute(self, mock_fetch):
        html = """
        <article class="product_pod">
          <h3><a href="catalogue/book-one_1/index.html">Book One</a></h3>
        </article>
        """
        mock_fetch.return_value = html

        result = discover_book_urls(["https://books.toscrape.com/"])

        self.assertEqual(
            result[0]["product_url"],
            "https://books.toscrape.com/catalogue/book-one_1/index.html",
        )


class TestMissingDescription(unittest.TestCase):
    def test_missing_description_becomes_none(self):
        html = """
        <html><body>
          <div class="product_main">
            <h1>Example Book</h1>
            <p class="price_color">£10.00</p>
            <p class="instock availability">In stock</p>
            <p class="star-rating Three"></p>
          </div>
        </body></html>
        """

        result = extract_book_details(
            html,
            "https://books.toscrape.com/catalogue/example/index.html",
            "https://books.toscrape.com/",
        )

        self.assertIsNone(result["description"])


class TestMalformedHtml(unittest.TestCase):
    def test_malformed_html_does_not_crash_parser(self):
        html = """
        <html><body>
          <article class="product_pod">
            <h3><a href="catalogue/book-one_1/index.html">Book One
        """

        soup = BeautifulSoup(html, "html.parser")
        link = soup.select_one("article.product_pod h3 a")

        self.assertIsNotNone(link)
        self.assertEqual(link.get("href"), "catalogue/book-one_1/index.html")


if __name__ == "__main__":
    unittest.main()
