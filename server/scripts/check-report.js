import { readFile } from "node:fs/promises";
import { extractPdf, retrieve } from "../src/report.js";
const path = process.argv[2];
if (!path) {
  console.error("Usage: npm run check:report -- /absolute/path/to/report.pdf");
  process.exit(1);
}
const report = await extractPdf(await readFile(path));
console.log(
  JSON.stringify({
    pages: report.pageCount,
    imageHeavyPages: report.imageHeavyPages,
    characters: report.pages.reduce((n, p) => n + p.text.length, 0),
  }),
);
const cases = [
  ["BLDC ceiling fan retrofit annual savings payback", [49, 50]],
  [
    "Annual electricity consumption April 2025 March 2026 TANGEDCO bill",
    [15, 16],
  ],
  ["APFC panel step 1 step 8 failure capacitor current", [30]],
  ["Main transformer rated capacity 1000 kVA 11 kV 433 V", [7]],
  ["Solar net metering approval cost savings emissions", [36]],
];
for (const [query, expected] of cases) {
  const pages = retrieve(report.index, query).map((p) => p.page);
  if (!expected.every((page) => pages.includes(page)))
    throw new Error(
      `Retrieval failed: ${query}: expected ${expected}, got ${pages}`,
    );
  console.log(
    JSON.stringify({ query, retrievedPages: pages, result: "passed" }),
  );
}
