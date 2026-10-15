import {
  GlobalWorkerOptions,
  getDocument
} from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerSource from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?raw";

export interface ParsedPdf {
  title: string;
  text: string;
}

export class ScannedPdfError extends Error {
  constructor() {
    super("PDF contains too little selectable text");
    this.name = "ScannedPdfError";
  }
}

type PdfTextItem = {
  str?: string;
  hasEOL?: boolean;
};

let workerUrl = "";

export async function readPdf(file: File): Promise<ParsedPdf> {
  ensurePdfWorker();
  const loadingTask = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
    useWorkerFetch: false
  });
  const document = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = joinPdfTextItems(content.items as PdfTextItem[]);
      if (pageText) pages.push(pageText);
      page.cleanup();
    }

    const text = pages.join("\n\n").trim();
    if (isLikelyScannedPdf(text, document.numPages)) throw new ScannedPdfError();

    const metadata = await document.getMetadata().catch(() => null);
    const info = metadata?.info as { Title?: unknown } | undefined;
    const title = typeof info?.Title === "string" ? info.Title.trim() : "";
    return { title, text };
  } finally {
    await document.destroy();
  }
}

export function joinPdfTextItems(items: PdfTextItem[]): string {
  let result = "";
  for (const item of items) {
    const text = item.str?.replace(/\s+/g, " ").trim() ?? "";
    if (text) {
      const needsSpace = Boolean(result) && !result.endsWith("\n") && shouldSeparate(result, text);
      result += `${needsSpace ? " " : ""}${text}`;
    }
    if (item.hasEOL && result && !result.endsWith("\n")) result += "\n";
  }
  return result
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isLikelyScannedPdf(text: string, pageCount: number): boolean {
  const readableCharacters = text.replace(/[\s\p{P}\p{S}]/gu, "").length;
  return readableCharacters < Math.max(12, pageCount * 3);
}

function ensurePdfWorker() {
  if (!workerUrl) {
    workerUrl = URL.createObjectURL(new Blob([pdfWorkerSource], { type: "text/javascript" }));
  }
  GlobalWorkerOptions.workerSrc = workerUrl;
}

function shouldSeparate(previous: string, next: string) {
  const previousCharacter = previous.at(-1) ?? "";
  const nextCharacter = next.at(0) ?? "";
  if (/[-—/]/.test(previousCharacter)) return false;
  if (/^[，。！？；：、,.!?;:）】》”’]/.test(nextCharacter)) return false;
  if (/[（【《“‘]/.test(previousCharacter)) return false;
  return /[\p{L}\p{N}]/u.test(previousCharacter) && /[\p{L}\p{N}]/u.test(nextCharacter);
}
