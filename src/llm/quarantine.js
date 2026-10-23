import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function quarantineEnrichmentFailure(
  record,
  { filePath } = {}
) {
  const targetPath = resolve(
    filePath ??
      process.env.LLM_QUARANTINE_PATH ??
      "data/quarantine/enrichment-failures.jsonl"
  );

  await mkdir(dirname(targetPath), { recursive: true });

  const entry = {
    quarantinedAt: new Date().toISOString(),
    ...record,
  };

  await appendFile(targetPath, `${JSON.stringify(entry)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  return targetPath;
}
