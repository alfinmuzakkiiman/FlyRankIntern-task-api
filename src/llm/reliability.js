export class LLMDisabledError extends Error {
  constructor() {
    super("LLM calls are disabled by configuration");
    this.name = "LLMDisabledError";
    this.code = "LLM_DISABLED";
  }
}

export function isLLMEnabled(env = process.env) {
  const value = env.LLM_ENABLED?.trim().toLowerCase();
  return !["false", "0", "off", "no"].includes(value);
}

function readInteger(env, name, fallback, min, max) {
  const raw = env[name]?.trim();

  if (raw === undefined || raw === "") {
    return fallback;
  }

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }

  const value = Number(raw);

  if (value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }

  return value;
}

export function getLLMRuntimeConfig(env = process.env) {
  return {
    timeoutMs: readInteger(env, "LLM_TIMEOUT_MS", 15000, 1, 120000),
    maxRetries: readInteger(env, "LLM_MAX_RETRIES", 2, 0, 5),
    retryBaseDelayMs: readInteger(
      env,
      "LLM_RETRY_BASE_DELAY_MS",
      250,
      0,
      10000
    ),
  };
}

export function isRetryableLLMError(error) {
  const status = Number(error?.status ?? error?.statusCode);

  if (Number.isFinite(status) && status > 0) {
    return status === 408 ||
      status === 409 ||
      status === 429 ||
      status >= 500;
  }

  const code = String(error?.code ?? "").toUpperCase();
  const retryableCodes = new Set([
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EAI_AGAIN",
    "ENOTFOUND",
    "UND_ERR_CONNECT_TIMEOUT",
  ]);

  if (retryableCodes.has(code)) {
    return true;
  }

  const description = `${String(error?.name ?? "")} ${String(error?.message ?? "")}`;
return /timeout|timed out|connectionerror|network error|fetch failed/i.test(description);
}

const defaultSleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function retryWithBackoff(
  operation,
  {
    maxRetries = 2,
    baseDelayMs = 250,
    sleep = defaultSleep,
    random = Math.random,
    shouldRetry = isRetryableLLMError,
    onRetry = () => {},
  } = {}
) {
  let retries = 0;

  while (true) {
    try {
      return {
        value: await operation(),
        retries,
      };
    } catch (error) {
      if (retries >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const jitter = 0.5 + Math.min(1, Math.max(0, random()));
      const delayMs = Math.round(baseDelayMs * 2 ** retries * jitter);

      onRetry({
        error,
        retryNumber: retries + 1,
        delayMs,
      });

      retries += 1;
      await sleep(delayMs);
    }
  }
}

function readCostRate(env, name) {
  const raw = env[name]?.trim();

  if (raw === undefined || raw === "") {
    return null;
  }

  const rate = Number(raw);
  return Number.isFinite(rate) && rate >= 0 ? rate : null;
}

export function estimateCostUsd(usage, env = process.env) {
  if (!usage) {
    return null;
  }

  const inputRate = readCostRate(env, "LLM_INPUT_COST_PER_1K_USD");
  const outputRate = readCostRate(env, "LLM_OUTPUT_COST_PER_1K_USD");
  const inputTokens = usage.promptTokens;
  const outputTokens = usage.completionTokens;

  if (
    inputRate === null ||
    outputRate === null ||
    !Number.isFinite(inputTokens) ||
    !Number.isFinite(outputTokens)
  ) {
    return null;
  }

  const cost =
    (inputTokens * inputRate + outputTokens * outputRate) / 1000;

  return Number(cost.toFixed(8));
}

export function logLLMMetric(entry) {
  const output = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const line = JSON.stringify(output);

  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
