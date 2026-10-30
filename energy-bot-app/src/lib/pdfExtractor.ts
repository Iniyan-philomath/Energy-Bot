import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ReportPageItem } from "./chatApi";

export async function extractPdfText(file: File): Promise<{
  filename: string;
  pageCount: number;
  pages: ReportPageItem[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const pages: ReportPageItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => {
        if (item && typeof item === "object" && "str" in item) {
          return String((item as { str: string }).str);
        }
        return "";
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      page: i,
      printedPage: String(i),
      text: pageText,
    });
  }

  return {
    filename: file.name,
    pageCount: pdf.numPages,
    pages,
  };
}
