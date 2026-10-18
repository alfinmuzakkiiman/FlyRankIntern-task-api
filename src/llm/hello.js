import OpenAI from "openai";

const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env;

if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_MODEL) {
  console.error("Missing LLM configuration. Check your .env file.");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
  timeout: 15000,
  maxRetries: 0,
});

try {
  const response = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      {
        role: "user",
        content: "Reply with exactly the word: ready",
      },
    ],
    temperature: 0,
  });

  const answer = response.choices[0]?.message?.content?.trim() ?? "";
  console.log(answer);

  if (!/\bready\b/i.test(answer)) {
    console.error("The model response did not contain 'ready'.");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("LLM request failed:", error.message);
  process.exitCode = 1;
}
