import {
  NdjsonDatasetLineSchema,
  NdjsonImageLineSchema,
  type NdjsonDatasetLine,
  type NdjsonImageLine,
} from "@/common/domain/dataset/schemas";

export class NdjsonParseError extends Error {
  constructor(
    message: string,
    public readonly lineErrors: Array<{ line: number; message: string }>,
  ) {
    super(message);
    this.name = "NdjsonParseError";
  }
}

export function parseNdjson(raw: string): {
  dataset: NdjsonDatasetLine;
  images: NdjsonImageLine[];
} {
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new NdjsonParseError("NDJSON is empty", []);
  }

  // Line 1 — dataset header
  let parsed0: unknown;
  try {
    parsed0 = JSON.parse(lines[0]!);
  } catch {
    throw new NdjsonParseError("Line 1 is not valid JSON", [{ line: 1, message: "Invalid JSON" }]);
  }

  const datasetResult = NdjsonDatasetLineSchema.safeParse(parsed0);
  if (!datasetResult.success) {
    throw new NdjsonParseError("Line 1 failed dataset schema validation", [
      { line: 1, message: datasetResult.error.message },
    ]);
  }

  // Lines 2+ — image records
  const images: NdjsonImageLine[] = [];
  const lineErrors: Array<{ line: number; message: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    let parsedLine: unknown;
    try {
      parsedLine = JSON.parse(lines[i]!);
    } catch {
      lineErrors.push({ line: lineNum, message: "Invalid JSON" });
      continue;
    }

    const result = NdjsonImageLineSchema.safeParse(parsedLine);
    if (!result.success) {
      lineErrors.push({ line: lineNum, message: result.error.message });
    } else {
      images.push(result.data);
    }
  }

  if (lineErrors.length > 0) {
    throw new NdjsonParseError(
      `NDJSON parse failed with ${lineErrors.length} line error(s)`,
      lineErrors,
    );
  }

  return { dataset: datasetResult.data, images };
}
