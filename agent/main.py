import json
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent

BRIEF_FILE = ROOT / "input" / "brief.md"
INSTRUCTIONS_FILE = ROOT / "instructions.md"
OUTPUT_FILE = ROOT / "output" / "review.md"

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen3:8b"


def main():
    # Read the real input files.
    if not BRIEF_FILE.exists():
        print(f"Error: brief file not found: {BRIEF_FILE}")
        sys.exit(1)

    if not INSTRUCTIONS_FILE.exists():
        print(f"Error: instructions file not found: {INSTRUCTIONS_FILE}")
        sys.exit(1)

    instructions = INSTRUCTIONS_FILE.read_text(encoding="utf-8")
    brief = BRIEF_FILE.read_text(encoding="utf-8")

    print("Assignment Brief Coach")
    print(f"Reading brief: {BRIEF_FILE.name}")
    print(f"Using model: {MODEL}")
    print("Sending brief to local Ollama model...")

    # Send the instructions and assignment brief to Ollama.
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": instructions,
            },
            {
                "role": "user",
                "content": (
                    "Analyze the following assignment brief according "
                    "to your instructions.\n\n"
                    "--- BEGIN ASSIGNMENT BRIEF ---\n"
                    f"{brief}\n"
                    "--- END ASSIGNMENT BRIEF ---"
                ),
            },
        ],
        "stream": False,
        "options": {"temperature": 0.2},
    }

    request = Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=180) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        print(f"Ollama returned HTTP error: {error.code}")
        print(error.read().decode("utf-8", errors="replace"))
        sys.exit(1)
    except URLError as error:
        print(f"Cannot connect to Ollama: {error.reason}")
        print("Check that Ollama is running, then try again.")
        sys.exit(1)
    except TimeoutError:
        print("The model request timed out. Try running the agent again.")
        sys.exit(1)

    review = result.get("message", {}).get("content", "").strip()

    if not review:
        print("Error: the model returned an empty response.")
        sys.exit(1)

    # Save the result without modifying the original brief.
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    report = (
        "# Assignment Brief Review\n\n"
        f"- Source file: `{BRIEF_FILE.relative_to(ROOT)}`\n"
        f"- Model: `{MODEL}`\n\n"
        "---\n\n"
        f"{review}\n"
    )
    OUTPUT_FILE.write_text(report, encoding="utf-8")

    print("\nAgent run completed successfully.")
    print(f"Saved review: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
