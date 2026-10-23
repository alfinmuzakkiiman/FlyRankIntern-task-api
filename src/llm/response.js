import { EnrichOutputSchema } from "./schema.js";

export class InvalidEnrichmentResponseError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = "InvalidEnrichmentResponseError";
    this.code = code;
    this.details = details;
  }
}

export function parseAndValidateEnrichment(rawContent) {
  let parsed;

  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    throw new InvalidEnrichmentResponseError(
      "INVALID_JSON",
      "LLM response is not valid JSON",
      { message: error.message }
    );
  }

  const result = EnrichOutputSchema.safeParse(parsed);

  if (!result.success) {
    throw new InvalidEnrichmentResponseError(
      "OUTPUT_SCHEMA_INVALID",
      "LLM response failed output schema validation",
      {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.length ? issue.path.join(".") : "body",
          code: issue.code,
          message: issue.message,
        })),
      }
    );
  }

  return result.data;
}
