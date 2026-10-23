import OpenAI from "openai";
import {
  ENRICH_PROMPT_VERSION,
  buildEnrichMessages,
} from "./prompts/enrich.v1.js";

function createClient() {
  const requiredEnv = ["LLM_BASE_URL", "LLM_API_KEY", "LLM_MODEL"];

  for (const key of requiredEnv) {
    if (!process.env[key]?.trim()) {
      throw new Error(`${key} is required`);
    }
  }

  return new OpenAI({
    baseURL: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
  });
}

async function requestCompletion(messages) {
  const response = await createClient().chat.completions.create({
    model: process.env.LLM_MODEL,
    messages,
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LLM returned an empty response");
  }

  return {
    promptVersion: ENRICH_PROMPT_VERSION,
    rawContent: content,
  };
}

export async function generateEnrichment(book) {
  return requestCompletion(buildEnrichMessages(book));
}

export async function repairEnrichment({
  book,
  invalidContent,
  validationError,
}) {
  const failureDetails = JSON.stringify(
    {
      code: validationError.code ?? "UNKNOWN_VALIDATION_ERROR",
      message: validationError.message,
      details: validationError.details ?? null,
    },
    null,
    2
  );

  const messages = [
    ...buildEnrichMessages(book),
    {
      role: "assistant",
      content: invalidContent,
    },
    {
      role: "user",
      content: [
        "Your previous response was rejected during JSON parsing or schema validation.",
        "Repair your previous response using the original book data and system instructions.",
        "Return exactly one valid JSON object, with no Markdown fences or commentary.",
        "Do not add fields or values outside the required output schema.",
        "Validation failure:",
        failureDetails,
      ].join("\n\n"),
    },
  ];

  return requestCompletion(messages);
}
