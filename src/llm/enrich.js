
import OpenAI from "openai";
import {
  ENRICH_PROMPT_VERSION,
  buildEnrichMessages,
} from "./prompts/enrich.v1.js";

export async function generateEnrichment(book) {
  const requiredEnv = [
    "LLM_BASE_URL",
    "LLM_API_KEY",
    "LLM_MODEL",
  ];

  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`${key} is required`);
    }
  }

  const client = new OpenAI({
    baseURL: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: process.env.LLM_MODEL,
    messages: buildEnrichMessages(book),
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
