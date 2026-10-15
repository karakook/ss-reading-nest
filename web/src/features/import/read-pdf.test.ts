import { describe, expect, it } from "vitest";
import { isLikelyScannedPdf, joinPdfTextItems } from "./read-pdf.js";

describe("PDF text extraction helpers", () => {
  it("keeps page line endings and separates adjacent words", () => {
    expect(joinPdfTextItems([
      { str: "The" },
      { str: "book", hasEOL: true },
      { str: "第二行。" }
    ])).toBe("The book\n第二行。");
  });

  it("does not insert spaces before Chinese punctuation", () => {
    expect(joinPdfTextItems([
      { str: "你好" },
      { str: "，" },
      { str: "小猫" }
    ])).toBe("你好，小猫");
  });

  it("recognizes image-only PDFs without rejecting readable books", () => {
    expect(isLikelyScannedPdf("", 12)).toBe(true);
    expect(isLikelyScannedPdf("封面", 8)).toBe(true);
    expect(isLikelyScannedPdf("这是一本可以正常提取正文的书。它有足够多的文字。", 2)).toBe(false);
  });
});
