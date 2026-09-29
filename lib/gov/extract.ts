import fs from "fs";
import path from "path";

export interface ExtractionResult {
  text: string;
  pageCount: number | null;
}

/**
 * Real, server-side text extraction -- no LLM involved. PDFs go through
 * pdf-parse, .docx through mammoth, everything else is read as plain text.
 */
export async function extractText(filePath: string, originalName: string): Promise<ExtractionResult> {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return { text: result.text ?? "", pageCount: result.pages?.length ?? null };
    } finally {
      await parser.destroy();
    }
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value ?? "", pageCount: null };
  }

  // .txt and anything else we don't have a dedicated parser for: read as text.
  return { text: buffer.toString("utf-8"), pageCount: null };
}

export interface DraftReport {
  title: string;
  summary: string;
  keyFigures: string[];
  wordCount: number;
  pageCount: number | null;
}

/**
 * Deterministic, heuristic draft report from extracted text -- no AI
 * summarisation. Pulls a title, the first few substantial sentences as a
 * "summary", and any sentence containing a number/percentage as a "key
 * figure". The Reports & Insights UI is explicit that this is an automatic
 * extraction, not an AI-written summary.
 */
export function buildDraftReport(extractedText: string, originalFilename: string, pageCount: number | null): DraftReport {
  const cleaned = extractedText.replace(/\s+/g, " ").trim();
  const words = cleaned.length ? cleaned.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const rawLines = extractedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 8 && l.length <= 140);
  const baseName = originalFilename
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const title = rawLines[0] || (baseName.length > 3 ? baseName : "Untitled uploaded document");

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20);
  const summarySentences = sentences.slice(0, 5);
  const summary = summarySentences.length ? summarySentences.join(" ") : cleaned.slice(0, 500) || "No extractable text was found in this file.";

  const figureSentences = sentences.filter((s) => /\d/.test(s) && s.length < 220);
  const seen = new Set<string>();
  const keyFigures: string[] = [];
  for (const s of figureSentences) {
    const trimmed = s.trim();
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      keyFigures.push(trimmed);
    }
    if (keyFigures.length >= 6) break;
  }

  return { title, summary, keyFigures, wordCount, pageCount };
}

export const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".docx", ".txt"];
