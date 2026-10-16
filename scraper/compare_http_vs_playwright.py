
import time
import threading

import psutil
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

URL = "https://quotes.toscrape.com/js/"
USER_AGENT = "FlyRank-PoliteScraper/1.0 (educational comparison)"
SAMPLE_INTERVAL = 0.02


def measure_peak_memory(action):
    process = psutil.Process()
    stop_sampling = threading.Event()
    peak_memory = [process.memory_info().rss]

    def sample_memory():
        while not stop_sampling.is_set():
            total = 0
            try:
                processes = [process] + process.children(recursive=True)
                for child in processes:
                    try:
                        total += child.memory_info().rss
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                peak_memory[0] = max(peak_memory[0], total)
            except psutil.NoSuchProcess:
                pass
            stop_sampling.wait(SAMPLE_INTERVAL)

    sampler = threading.Thread(target=sample_memory, daemon=True)
    sampler.start()
    start = time.perf_counter()

    try:
        result = action()
    finally:
        elapsed = time.perf_counter() - start
        stop_sampling.set()
        sampler.join()

    return result, elapsed, peak_memory[0] / (1024 * 1024)


def run_http():
    response = requests.get(
        URL,
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    return {
        "status": response.status_code,
        "title": soup.title.get_text(strip=True) if soup.title else None,
        "quotes_found": len(soup.select(".quote")),
    }


def run_browser():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        response = page.goto(URL, wait_until="networkidle", timeout=30000)
        result = {
            "status": response.status if response else None,
            "title": page.title(),
            "quotes_found": page.locator(".quote").count(),
        }
        browser.close()
        return result


if __name__ == "__main__":
    for label, action in (
        ("HTTP + Beautiful Soup", run_http),
        ("Playwright Chromium", run_browser),
    ):
        try:
            result, seconds, peak_mb = measure_peak_memory(action)
            print(f"\n{label}")
            print(f"  Result: {result}")
            print(f"  Elapsed seconds: {seconds:.3f}")
            print(f"  Peak process-tree memory (MiB): {peak_mb:.1f}")
        except Exception as error:
            print(f"\n{label} failed: {type(error).__name__}: {error}")
