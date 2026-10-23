import {
  generateEnrichment,
  repairEnrichment,
} from "./enrich.js";
import {
  InvalidEnrichmentResponseError,
  parseAndValidateEnrichment,
} from "./response.js";
import { quarantineEnrichmentFailure } from "./quarantine.js";

export class EnrichmentQuarantinedError extends Error {
  constructor() {
    super("LLM output remained invalid after one repair attempt and was quarantined");
    this.name = "EnrichmentQuarantinedError";
    this.code = "LLM_OUTPUT_QUARANTINED";
  }
}

function describeFailure(error) {
  return {
    name: error.name,
    code: error.code ?? "UNKNOWN_ERROR",
    message: error.message,
    details: error.details ?? null,
  };
}

export async function enrichBook(
  book,
  {
    generate = generateEnrichment,
    repair = repairEnrichment,
    quarantine = quarantineEnrichmentFailure,
  } = {}
) {
  const firstResponse = await generate(book);

  try {
    return {
      data: parseAndValidateEnrichment(firstResponse.rawContent),
      promptVersion: firstResponse.promptVersion,
      repaired: false,
    };
  } catch (firstError) {
    if (!(firstError instanceof InvalidEnrichmentResponseError)) {
      throw firstError;
    }

    let repairedResponse;

    try {
      repairedResponse = await repair({
        book,
        invalidContent: firstResponse.rawContent,
        validationError: firstError,
      });
    } catch (repairCallError) {
      await quarantine({
        book,
        promptVersion: firstResponse.promptVersion,
        initialResponse: firstResponse.rawContent,
        repairResponse: null,
        initialFailure: describeFailure(firstError),
        repairFailure: describeFailure(repairCallError),
      });

      throw new EnrichmentQuarantinedError();
    }

    try {
      return {
        data: parseAndValidateEnrichment(repairedResponse.rawContent),
        promptVersion:
          repairedResponse.promptVersion ?? firstResponse.promptVersion,
        repaired: true,
      };
    } catch (repairError) {
      if (!(repairError instanceof InvalidEnrichmentResponseError)) {
        throw repairError;
      }

      await quarantine({
        book,
        promptVersion: firstResponse.promptVersion,
        initialResponse: firstResponse.rawContent,
        repairResponse: repairedResponse.rawContent,
        initialFailure: describeFailure(firstError),
        repairFailure: describeFailure(repairError),
      });

      throw new EnrichmentQuarantinedError();
    }
  }
}
