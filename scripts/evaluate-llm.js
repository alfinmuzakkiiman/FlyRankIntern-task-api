import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { EnrichOutputSchema } from "../src/llm/schema.js";
import { enrichBook } from "../src/llm/pipeline.js";

const datasetUrl = new URL("../evals/stage5-cases.json", import.meta.url);
const dataset = JSON.parse(await readFile(datasetUrl, "utf8"));

const startedAt = new Date().toISOString();
const runStarted = Date.now();
const results = [];

for (const evaluationCase of dataset.cases) {
  const caseStarted = Date.now();

  try {
    const result = await enrichBook(evaluationCase.input);
    const validation = EnrichOutputSchema.safeParse(result.data);
    const output = result.data;

    const checks = {
      schemaValid: validation.success,
      categoryMatch: output.category === evaluationCase.expectedCategory,
      requiredFlagsPresent: evaluationCase.requiredFlags.every(
        (flag) => output.quality_flags.includes(flag)
      ),
      summaryValid:
        typeof output.summary === "string" &&
        output.summary.trim().length > 0 &&
        output.summary.length <= 300,
    };

    const passed = Object.values(checks).every(Boolean);

    results.push({
      id: evaluationCase.id,
      scenario: evaluationCase.scenario,
      expectedCategory: evaluationCase.expectedCategory,
      actualCategory: output.category,
      requiredFlags: evaluationCase.requiredFlags,
      actualFlags: output.quality_flags,
      checks,
      passed,
      repaired: result.repaired,
      promptVersion: result.promptVersion,
      durationMs: Date.now() - caseStarted,
      output,
    });

    console.log(
      `${passed ? "PASS" : "FAIL"} ${evaluationCase.id} ` +
        `(category: ${output.category}, repaired: ${result.repaired})`
    );
  } catch (error) {
    results.push({
      id: evaluationCase.id,
      scenario: evaluationCase.scenario,
      expectedCategory: evaluationCase.expectedCategory,
      requiredFlags: evaluationCase.requiredFlags,
      passed: false,
      durationMs: Date.now() - caseStarted,
      error: {
        name: error.name,
        code: error.code ?? null,
        message: error.message,
      },
    });

    console.error(`FAIL ${evaluationCase.id}: ${error.message}`);
  }
}

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;

const report = {
  suite: dataset.version,
  startedAt,
  completedAt: new Date().toISOString(),
  durationMs: Date.now() - runStarted,
  model: process.env.LLM_MODEL ?? null,
  totalCases: results.length,
  passed,
  failed,
  passRate: Number((passed / results.length).toFixed(4)),
  results,
};

const reportPath = resolve(
  process.env.LLM_EVAL_REPORT_PATH ??
    "evals/results/stage5-report.json"
);

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("\nEvaluation summary");
console.log(`Total: ${report.totalCases}`);
console.log(`Passed: ${report.passed}`);
console.log(`Failed: ${report.failed}`);
console.log(`Pass rate: ${(report.passRate * 100).toFixed(1)}%`);
console.log(`Report: ${reportPath}`);

if (failed > 0) {
  process.exitCode = 1;
}
