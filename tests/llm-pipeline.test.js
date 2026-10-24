import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  InvalidEnrichmentResponseError,
  parseAndValidateEnrichment,
} from "../src/llm/response.js";
import {
  enrichBook,
  EnrichmentQuarantinedError,
} from "../src/llm/pipeline.js";
import { quarantineEnrichmentFailure } from "../src/llm/quarantine.js";

const book = {
  title: "The Hobbit",
  description: "A fantasy novel about a hobbit on a quest.",
  price_gbp: 12.5,
};

const validOutput = {
  category: "fiction",
  summary: "A hobbit's adventurous quest in a fantasy world.",
  quality_flags: [],
};

const validRawContent = JSON.stringify(validOutput);

test("parses and validates a valid LLM response", () => {
  assert.deepEqual(
    parseAndValidateEnrichment(validRawContent),
    validOutput
  );
});

test("rejects malformed JSON", () => {
  assert.throws(
    () => parseAndValidateEnrichment("{not valid JSON"),
    (error) =>
      error instanceof InvalidEnrichmentResponseError &&
      error.code === "INVALID_JSON"
  );
});

test("rejects output that violates the Zod schema", () => {
  assert.throws(
    () =>
      parseAndValidateEnrichment(
        JSON.stringify({
          category: "made_up_category",
          summary: "",
          quality_flags: ["unknown_flag"],
        })
      ),
    (error) =>
      error instanceof InvalidEnrichmentResponseError &&
      error.code === "OUTPUT_SCHEMA_INVALID"
  );
});

test("repairs an invalid response exactly once", async () => {
  let generateCalls = 0;
  let repairCalls = 0;

  const result = await enrichBook(book, {
    generate: async () => {
      generateCalls += 1;
      return {
        promptVersion: "enrich-v1",
        rawContent: "{broken JSON",
      };
    },
    repair: async ({ invalidContent, validationError }) => {
      repairCalls += 1;
      assert.equal(invalidContent, "{broken JSON");
      assert.equal(validationError.code, "INVALID_JSON");

      return {
        promptVersion: "enrich-v1",
        rawContent: validRawContent,
      };
    },
    quarantine: async () => {
      assert.fail("Valid repaired output must not be quarantined");
    },
  });

  assert.equal(generateCalls, 1);
  assert.equal(repairCalls, 1);
  assert.equal(result.repaired, true);
  assert.equal(result.promptVersion, "enrich-v1");
  assert.deepEqual(result.data, validOutput);
});

test("quarantines output that remains invalid after repair", async () => {
  let repairCalls = 0;
  let quarantinedRecord;

  await assert.rejects(
    enrichBook(book, {
      generate: async () => ({
        promptVersion: "enrich-v1",
        rawContent: "{broken JSON",
      }),
      repair: async () => {
        repairCalls += 1;
        return {
          promptVersion: "enrich-v1",
          rawContent: '{"category":"unknown"}',
        };
      },
      quarantine: async (record) => {
        quarantinedRecord = record;
      },
    }),
    (error) =>
      error instanceof EnrichmentQuarantinedError &&
      error.code === "LLM_OUTPUT_QUARANTINED"
  );

  assert.equal(repairCalls, 1);
  assert.equal(quarantinedRecord.book.title, "The Hobbit");
  assert.equal(quarantinedRecord.promptVersion, "enrich-v1");
  assert.equal(quarantinedRecord.initialResponse, "{broken JSON");
  assert.equal(
    quarantinedRecord.repairResponse,
    '{"category":"unknown"}'
  );
  assert.equal(
    quarantinedRecord.repairFailure.code,
    "OUTPUT_SCHEMA_INVALID"
  );
});

test("writes quarantine records as JSONL", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "w7-quarantine-"));
  const filePath = join(tempDir, "failures.jsonl");

  try {
    await quarantineEnrichmentFailure(
      {
        promptVersion: "enrich-v1",
        book,
        initialResponse: "{broken JSON",
        repairResponse: '{"category":"unknown"}',
        initialFailure: { code: "INVALID_JSON" },
        repairFailure: { code: "OUTPUT_SCHEMA_INVALID" },
      },
      { filePath }
    );

    const contents = await readFile(filePath, "utf8");
    const rows = contents.trim().split("\n").map(JSON.parse);

    assert.equal(rows.length, 1);
    assert.equal(rows[0].promptVersion, "enrich-v1");
    assert.equal(rows[0].book.title, "The Hobbit");
    assert.ok(rows[0].quarantinedAt);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("enforces missing-price flag from input when model omits it", async () => {
  const result = await enrichBook(
    {
      title: "The Hobbit",
      description: "A fantasy novel about a hobbit on a quest."
    },
    {
      generate: async () => ({
        promptVersion: "enrich-v2",
        rawContent: JSON.stringify({
          category: "fiction",
          summary: "A fantasy novel about a hobbit on a quest.",
          quality_flags: [],
        }),
      }),
    }
  );

  assert.ok(result.data.quality_flags.includes("missing_price"));
});

test("enforces missing-description flags from input", async () => {
  const result = await enrichBook(
    { title: "Untitled Manuscript Q17", price_gbp: 8.5 },
    {
      generate: async () => ({
        promptVersion: "enrich-v2",
        rawContent: JSON.stringify({
          category: "fiction",
          summary: "No description was supplied.",
          quality_flags: [],
        }),
      }),
    }
  );

  assert.equal(result.data.category, "other");
  assert.ok(result.data.quality_flags.includes("missing_description"));
  assert.ok(result.data.quality_flags.includes("insufficient_information"));
  assert.ok(result.data.quality_flags.includes("ambiguous_category"));
});
