import assert from "node:assert/strict";
import test from "node:test";

import {
  estimateCostUsd,
  getLLMRuntimeConfig,
  isLLMEnabled,
  isRetryableLLMError,
  retryWithBackoff,
} from "../src/llm/reliability.js";

test("uses safe default runtime settings", () => {
  assert.deepEqual(
    getLLMRuntimeConfig({}),
    {
      timeoutMs: 15000,
      maxRetries: 2,
      retryBaseDelayMs: 250,
    }
  );
});

test("rejects invalid timeout configuration", () => {
  assert.throws(
    () => getLLMRuntimeConfig({ LLM_TIMEOUT_MS: "0" }),
    /LLM_TIMEOUT_MS/
  );
});

test("kill switch is enabled by default and can be turned off", () => {
  assert.equal(isLLMEnabled({}), true);
  assert.equal(isLLMEnabled({ LLM_ENABLED: "true" }), true);
  assert.equal(isLLMEnabled({ LLM_ENABLED: "false" }), false);
  assert.equal(isLLMEnabled({ LLM_ENABLED: "0" }), false);
});

test("retries transient failures with exponential backoff", async () => {
  let calls = 0;
  const delays = [];

  const result = await retryWithBackoff(
    async () => {
      calls += 1;

      if (calls < 3) {
        const error = new Error("Temporary server failure");
        error.status = 503;
        throw error;
      }

      return "success";
    },
    {
      maxRetries: 2,
      baseDelayMs: 100,
      random: () => 0.5,
      sleep: async (ms) => delays.push(ms),
    }
  );

  assert.equal(result.value, "success");
  assert.equal(result.retries, 2);
  assert.equal(calls, 3);
  assert.deepEqual(delays, [100, 200]);
});

test("does not retry permanent authentication errors", async () => {
  let calls = 0;

  await assert.rejects(
    retryWithBackoff(
      async () => {
        calls += 1;
        const error = new Error("Unauthorized");
        error.status = 401;
        throw error;
      },
      {
        maxRetries: 2,
        sleep: async () => {},
      }
    ),
    /Unauthorized/
  );

  assert.equal(calls, 1);
  assert.equal(isRetryableLLMError({ status: 401 }), false);
});

test("estimates cost when usage and pricing are configured", () => {
  const cost = estimateCostUsd(
    { promptTokens: 1000, completionTokens: 500 },
    {
      LLM_INPUT_COST_PER_1K_USD: "0.01",
      LLM_OUTPUT_COST_PER_1K_USD: "0.02",
    }
  );

  assert.equal(cost, 0.02);
});

test("returns null when provider pricing is unknown", () => {
  assert.equal(
    estimateCostUsd(
      { promptTokens: 1000, completionTokens: 500 },
      {}
    ),
    null
  );
});

test("recognizes timeout messages as retryable", () => {
  const error = new Error("Request timed out.");
  assert.equal(isRetryableLLMError(error), true);
});
