@"
# Polite Book Scraper

A small Python scraper for the Books to Scrape practice site.

## Stack

- Python 3.10+
- Requests
- Beautiful Soup
- Pydantic
- JSON

## Target

The scraper targets the Books to Scrape practice website:

https://books.toscrape.com/

The assignment scope is limited to three catalogue pages, with an expected total of 60 book records.

## Robots.txt

Checked:

https://books.toscrape.com/robots.txt

Result:

404 Not Found - no robots file found.

The missing robots.txt file is not treated as permission to scrape any website. The scraper will remain limited to the assignment target and will use polite request behavior.

## Polite Scraping Rules

The scraper will:

- identify itself with a descriptive User-Agent
- use request timeouts
- wait at least 500 ms between requests
- avoid unnecessary requests
- cache fetched pages
- validate extracted data before writing output

## Scope

Only the three catalogue pages required by the assignment will be collected.

The scraper is not intended for unrestricted crawling.

## Reuse Policy

I will not reuse this code on another site without checking its rules and terms first.
"@ | Set-Content scraper\README.md
