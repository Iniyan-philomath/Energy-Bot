import { readFile, writeFile } from "node:fs/promises";
import { extractPdf } from "./src/report.js";

const pdfPath = "C:\\Users\\iniya\\OneDrive\\Desktop\\sce-energy-audit-2025-2026.pdf";
const buffer = await readFile(pdfPath);
const report = await extractPdf(buffer);

console.log(`Extracted ${report.pages.length} pages from PDF!`);
console.log(`Page count: ${report.pageCount}`);

const pagesJson = report.pages.map(p => ({
  page: p.page,
  printedPage: p.printedPage,
  text: p.text
}));

await writeFile("extracted-pages.json", JSON.stringify(pagesJson, null, 2));
console.log("Saved all extracted pages to server/extracted-pages.json!");
