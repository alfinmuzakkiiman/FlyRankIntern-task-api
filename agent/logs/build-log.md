# Agent Build Log

## 1. Initial Setup

I built an Assignment Brief Coach using Python and Ollama on my MacBook Pro with an M1 Pro chip and 16 GB of memory. My Python version was 3.9.6.

I did not have an OpenAI API key, so I decided to use a local AI model. I installed Ollama version 0.40.5 and downloaded Qwen3 8B, which required about 5.2 GB of storage.

## 2. Problems Encountered

At the beginning, the `ollama` command was not found because Ollama had not been installed yet. I installed the application and checked that the command worked.

I also accidentally entered terminal prompt text and part of an API response as commands. This caused shell errors. I learned to copy only the command itself and treat the output as information to read, not as another command to execute.

## 3. Changes and Decisions

I chose Ollama and Qwen3 8B because I wanted to build the agent without an OpenAI API key.

I checked that the local Ollama API was available and tested a chat request before connecting it to Python.

I kept the MVP small. I separated the program, AI instructions, assignment input, and output into different files. I used Python's built-in libraries for reading files, sending HTTP requests, and processing JSON, so I did not need additional Python packages.

I did not add a graphical interface or multiple tools because the first goal was to get one complete end-to-end run working.

## 4. First Successful Run

I ran `python3 agent/main.py`. The program read `agent/input/brief.md` and `agent/instructions.md`, sent the assignment brief to the local Qwen3 model, and saved the response to `agent/output/review.md`.

The generated review contained the assignment goal, work checklist, evaluation criteria, deliverables, and information that might need confirmation.

This confirmed that the basic end-to-end workflow worked. The first end-to-end run succeeded. Further testing with a second brief
and the raw screen capture were completed afterward.

## 5. Log Maintenance Note

This initial log was consolidated after the first successful run using the actual terminal outputs and decisions made during setup. Future tests, errors, and changes will be recorded as they happen.

## 6. Second Brief Test

I tested the agent with a different brief about renewable energy. Without changing `main.py`, the agent produced a review with the goal, checklist, evaluation criteria, deliverable, and confirmation section.

After the test, I restored the original FL-07 brief and ran the agent again. The original brief was processed successfully.

The test showed that the agent can handle different assignment topics using the same workflow. I also noticed a small spacing typo in the generated Indonesian review (`jelas dan`). This means the output is useful but still needs a quality check before submission.


## 7. Raw Screen Capture

I recorded a screen capture showing the assignment brief, the agent execution, and the generated review. The recording demonstrates the workflow from input to output without editing the video.
