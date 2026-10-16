# Polite Book Scraper

A Python scraper for the Books to Scrape practice website.

## Stack

- Python 3.10+
- Requests
- Beautiful Soup
- Pydantic
- JSON

## Target and Scope

Target: https://books.toscrape.com/

The scraper is limited to three catalogue pages and is expected to collect 60 unique book records. It discovers product URLs from catalogue links rather than hardcoding individual book URLs.

## Robots.txt

Checked: https://books.toscrape.com/robots.txt

Result: 404 Not Found.

A missing robots.txt file is not treated as permission to scrape any website. This project remains limited to the assignment target and uses polite request behavior.

## Pipeline

The scraper follows this pipeline:

1. **Classify** — identify the target and scope.
2. **Fetch** — request pages with a descriptive User-Agent and timeout.
3. **Extract** — parse catalogue and book details using Beautiful Soup.
4. **Normalize** — convert price text into a numeric GBP value.
5. **Validate** — validate records with Pydantic.
6. **Store** — write valid records and validation errors to JSON.
7. **Report** — write a run report, including failed pages.

## Setup

Requirements: Python 3.10 or newer.

From the repository root, install dependencies:

`powershell
py -m pip install requests beautifulsoup4 pydantic
`

## Run

From the repository root:

`powershell
py scraper/src/main.py
`

The scraper caches fetched HTML so subsequent runs can reuse cached pages and reduce unnecessary requests.

## Output Files

Generated files are stored in scraper/output/:

- ooks.json — validated book records.
- errors.json — records that failed normalization or validation.
- un-report.json — run timing, fetched-page count, cache hits, valid and invalid record counts, and failed-page details.

The expected successful result is 60 unique valid book records. Actual results depend on available pages and execution conditions.


## Example Run Evidence

A successful run on 2026-10-16 produced:

```json
{
  "duration_seconds": 13.14,
  "pages_fetched": 6,
  "cache_hits": 61,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failed_page_urls": []
}
```

A separate failure-injection test used a deliberately invalid
test URL. That run recorded one failed page while retaining
60 valid book records. This demonstrates that an individual
page failure does not stop the entire scraping job.


## Polite Scraping Rules

- Identify the scraper with a descriptive User-Agent.
- Set a request timeout.
- Wait at least 500 ms between real requests.
- Cache fetched pages to avoid unnecessary requests.
- Retry a timeout or HTTP 5xx response once.
- Do not retry HTTP 403 or 404 responses.
- Validate extracted data before storing it.
- Continue processing other books when an individual detail page fails.

## Failure Testing

A simulated failure can be tested with the SCRAPER_TEST_FAILURE environment variable in PowerShell:

`powershell
 = "1"
py scraper/src/main.py
Remove-Item Env:SCRAPER_TEST_FAILURE
`

This test adds a deliberately invalid test URL. The failed page should appear in un-report.json, while other successfully processed books should still be stored.

## HTTP Request vs Browser Automation

A separate experiment compared a normal HTTP request with Beautiful Soup against Playwright Chromium on `https://quotes.toscrape.com/js/`.

### Observed results

| Measurement | HTTP + Beautiful Soup | Playwright Chromium |
|---|---:|---:|
| HTTP status | 200 | 200 |
| Quotes found | 0 | 10 |
| Elapsed time | 1.269 seconds | 9.950 seconds |
| Peak process-tree memory | 42.7 MiB | 350.6 MiB |

These values are from one local run. Execution time and memory use can vary with network conditions, machine load, and browser startup overhead. Peak memory is an approximate sampled RSS total for the Python process and its child processes.

### Interpretation

The ordinary HTTP request was faster and used less memory in this run, but it found no quotes because the page renders its quote content with JavaScript. Playwright executed the page's JavaScript and found 10 quotes.

The main Books to Scrape catalogue scraper does not need browser automation because its required book data is available in the HTML returned by ordinary HTTP requests. A browser should be considered when the required content depends on client-side JavaScript rendering, not used by default.

This comparison is a small experiment, not a universal performance benchmark.

## Ethics and Reuse

I will not reuse this code on another site without checking its rules and terms first.
