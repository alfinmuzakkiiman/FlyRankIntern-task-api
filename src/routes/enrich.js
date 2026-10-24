import { Router } from "express";
import {
  EnrichInputSchema,
  EnrichOutputSchema,
} from "../llm/schema.js";
import {
  enrichBook,
  EnrichmentQuarantinedError,
} from "../llm/pipeline.js";
import { isLLMEnabled } from "../llm/reliability.js";

const router = Router();

router.post("/enrich", async (req, res) => {
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

  if (process.env.LLM_STUB === "1") {
    const { title, description, price_gbp } = inputResult.data;
    const qualityFlags = [];

    if (!description?.trim()) {
      qualityFlags.push("missing_description");
    }

    if (price_gbp === undefined) {
      qualityFlags.push("missing_price");
    }

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
  }

  if (!isLLMEnabled()) {
    return res.status(503).json({
      error: "LLM enrichment is disabled",
      code: "LLM_DISABLED",
    });
  }

  try {
    const result = await enrichBook(inputResult.data);
    return res.status(200).json(result.data);
  } catch (error) {
    if (error instanceof EnrichmentQuarantinedError) {
      return res.status(502).json({
        error: "LLM output remained invalid after one repair attempt and was quarantined",
        code: error.code,
      });
    }

    return res.status(502).json({
      error: "LLM enrichment failed",
      code: "LLM_ENRICHMENT_FAILED",
    });
  }
});

export default router;
