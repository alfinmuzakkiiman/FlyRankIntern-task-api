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
    super(
      "LLM output remained invalid after one repair attempt and was quarantined"
    );
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

function enforceInputQualityFlags(data, book) {
  const flags = new Set(data.quality_flags);
  let category = data.category;

  const descriptionMissing =
    typeof book.description !== "string" || !book.description.trim();

  const priceMissing = book.price_gbp === undefined;

  // These flags are based on known input fields, not model guesses.
  if (descriptionMissing) {
    category = "other";
    flags.add("missing_description");
    flags.add("insufficient_information");
    flags.add("ambiguous_category");
  } else {
    flags.delete("missing_description");
  }

  if (priceMissing) {
    flags.add("missing_price");
  } else {
    flags.delete("missing_price");
  }

  return {
    ...data,
    category,
    quality_flags: [...flags],
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
    const data = parseAndValidateEnrichment(firstResponse.rawContent);

    return {
      data: enforceInputQualityFlags(data, book),
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
      const data = parseAndValidateEnrichment(repairedResponse.rawContent);

      return {
        data: enforceInputQualityFlags(data, book),
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
