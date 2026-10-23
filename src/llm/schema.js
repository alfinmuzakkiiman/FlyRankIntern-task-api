import { z } from "zod";

export const CATEGORIES = [
  "fiction",
  "non_fiction",
  "children",
  "poetry",
  "reference",
  "other",
];

export const QUALITY_FLAGS = [
  "missing_description",
  "missing_price",
  "insufficient_information",
  "ambiguous_category",
];

export const EnrichInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    price_gbp: z.number().finite().nonnegative().optional(),
  })
  .strict();

export const EnrichOutputSchema = z
  .object({
    category: z.enum(CATEGORIES),
    summary: z.string().trim().min(1).max(300),
    quality_flags: z
      .array(z.enum(QUALITY_FLAGS))
      .max(QUALITY_FLAGS.length)
      .refine(
        (flags) => new Set(flags).size === flags.length,
        "quality_flags must not contain duplicates"
      ),
  })
  .strict();
