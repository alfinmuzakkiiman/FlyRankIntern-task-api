import OpenAI from "openai";
import {
  ENRICH_PROMPT_VERSION,
  buildEnrichMessages,
} from "./prompts/enrich.v2.js";
import {
  estimateCostUsd,
  getLLMRuntimeConfig,
  isLLMEnabled,
  LLMDisabledError,
  logLLMMetric,
  retryWithBackoff,
} from "./reliability.js";

function createClient(timeoutMs) {
  const requiredEnv = [
    "LLM_BASE_URL",
    "LLM_API_KEY",
    "LLM_MODEL",
  ];

  for (const key of requiredEnv) {
    if (!process.env[key]?.trim()) {
      throw new Error(`${key} is required`);
    }
  }

  return new OpenAI({
    baseURL: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
    timeout: timeoutMs,
    // Retries are managed here, not by the SDK.
    maxRetries: 0,
  });
}

async function requestCompletion(messages) {
  if (!isLLMEnabled()) {
    throw new LLMDisabledError();
  }

  const config = getLLMRuntimeConfig();
  const client = createClient(config.timeoutMs);
  const model = process.env.LLM_MODEL;
  const startedAt = Date.now();
  let attempts = 0;

  try {
    const { value: response, retries } = await retryWithBackoff(
      () => {
        attempts += 1;

        const requestOptions = {
          model,
          messages,
          temperature: 0,
          max_tokens: 256,
        };

        // Optional provider-specific control. For supported Ollama Qwen3
        // versions, "none" disables thinking for short JSON tasks.
        const reasoningEffort = process.env.LLM_REASONING_EFFORT?.trim();
        if (reasoningEffort) {
          requestOptions.reasoning_effort = reasoningEffort;
        }

        return client.chat.completions.create(requestOptions);
      },
      {
        maxRetries: config.maxRetries,
        baseDelayMs: config.retryBaseDelayMs,
        onRetry: ({ error, retryNumber, delayMs }) => {
          logLLMMetric({
            level: "warn",
            event: "llm_retry",
            promptVersion: ENRICH_PROMPT_VERSION,
            model,
            retryNumber,
            maxRetries: config.maxRetries,
            delayMs,
            errorName: error.name,
            errorCode: error.code ?? null,
            httpStatus: error.status ?? null,
          });
        },
      }
    );

    const content = response.choices[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("LLM returned an empty response");
    }

    const usage = response.usage
      ? {
          promptTokens: response.usage.prompt_tokens ?? null,
          completionTokens: response.usage.completion_tokens ?? null,
          totalTokens: response.usage.total_tokens ?? null,
        }
      : null;

    const estimatedCostUsd = estimateCostUsd(usage);
    const latencyMs = Date.now() - startedAt;

    logLLMMetric({
      event: "llm_request_succeeded",
      promptVersion: ENRICH_PROMPT_VERSION,
      model,
      latencyMs,
      attempts,
      retries,
      usage,
      estimatedCostUsd,
    });

    return {
      promptVersion: ENRICH_PROMPT_VERSION,
      rawContent: content,
      usage,
      estimatedCostUsd,
      retries,
      latencyMs,
    };
  } catch (error) {
    logLLMMetric({
      level: "error",
      event: "llm_request_failed",
      promptVersion: ENRICH_PROMPT_VERSION,
      model,
      latencyMs: Date.now() - startedAt,
      attempts,
      errorName: error.name,
      errorCode: error.code ?? null,
      httpStatus: error.status ?? null,
    });

    throw error;
  }
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
