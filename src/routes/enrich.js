import { Router } from "express";
import {
  EnrichInputSchema,
  EnrichOutputSchema,
} from "../llm/schema.js";

const router = Router();

router.post("/enrich", (req, res) => {
  const inputResult = EnrichInputSchema.safeParse(req.body);

  if (!inputResult.success) {
    return res.status(400).json({
      error: "Invalid input",
      fields: inputResult.error.issues.map((issue) => ({
        field: issue.path.length ? issue.path.join(".") : "body",
        message: issue.message,
      })),
    });
  }

  if (process.env.LLM_STUB !== "1") {
    return res.status(503).json({
      error: "LLM integration is not enabled yet",
      hint: "Set LLM_STUB=1 to test the endpoint with a deterministic stub.",
    });
  }

  const { title, description, price_gbp } = inputResult.data;
  const qualityFlags = [];

  if (!description?.trim()) {
    qualityFlags.push("missing_description");
  }

  if (price_gbp === undefined) {
    qualityFlags.push("missing_price");
  }

  // The stub cannot classify or summarize the actual book.
  qualityFlags.push("insufficient_information");

  const outputResult = EnrichOutputSchema.safeParse({
    category: "other",
    summary: `Stub enrichment for "${title}".`,
    quality_flags: qualityFlags,
  });

  if (!outputResult.success) {
    return res.status(500).json({
      error: "Internal output schema validation failed",
    });
  }

  return res.status(200).json(outputResult.data);
});

export default router;
