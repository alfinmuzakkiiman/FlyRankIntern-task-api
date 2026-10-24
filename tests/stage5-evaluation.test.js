import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CATEGORIES,
  QUALITY_FLAGS,
  EnrichInputSchema,
} from "../src/llm/schema.js";

const datasetUrl = new URL("../evals/stage5-cases.json", import.meta.url);
const dataset = JSON.parse(await readFile(datasetUrl, "utf8"));

test("evaluation dataset contains exactly 8 unique cases", () => {
  assert.equal(dataset.cases.length, 8);

  const ids = dataset.cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("all evaluation inputs pass the input schema", () => {
  for (const item of dataset.cases) {
    const result = EnrichInputSchema.safeParse(item.input);

    assert.equal(
      result.success,
      true,
      `${item.id} has invalid input: ${JSON.stringify(result.error?.issues)}`
    );
  }
});

test("evaluation dataset covers every supported category", () => {
  const expectedCategories = new Set(
    dataset.cases.map((item) => item.expectedCategory)
  );

  assert.deepEqual(
    [...expectedCategories].sort(),
    [...CATEGORIES].sort()
  );
});

test("evaluation dataset covers every quality flag", () => {
  const coveredFlags = new Set(
    dataset.cases.flatMap((item) => item.requiredFlags)
  );

  assert.deepEqual([...coveredFlags].sort(), [...QUALITY_FLAGS].sort());
});
