import { PDFParse } from "pdf-parse";
import { ServiceError } from "./errors.js";
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
const stop = new Set(
  "a an the is are was were be been do does did what which how who why when where me my your our about of on in at for to from and or with this that these those it its please tell explain report audit document pdf college campus energy".split(
    " ",
  ),
);
export function tokens(text) {
  return (
    String(text)
      .normalize("NFKC")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((t) => t.length > 1 && !stop.has(t)) || []
  );
}
const expansions = {
  fan: ["fans", "bldc"],
  fans: ["fan", "bldc"],
  bldc: ["fans", "retrofit"],
  transformer: ["kva", "loading"],
  generators: ["dg", "diesel"],
  generator: ["dg", "diesel"],
  solar: ["pv", "generation"],
  capacitor: ["apfc", "kvar"],
  apfc: ["capacitor", "stages"],
  motor: ["motors", "ie1", "ie3"],
  motors: ["motor", "ie1", "ie3"],
  bill: ["billing", "tangedco"],
  bills: ["billing", "tangedco"],
  savings: ["saving"],
  saving: ["savings"],
  consumption: ["kwh", "consumed"],
};
export function createIndex(pages) {
  const searchable = pages.filter((p) => p.text.trim().length > 100);
  const documentFrequency = new Map();
  const indexed = searchable.map((page) => {
    const terms = tokens(page.text);
    const frequencies = new Map();
    for (const term of terms)
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    for (const term of frequencies.keys())
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    return { ...page, frequencies, length: terms.length };
  });
  return {
    pages: indexed,
    documentFrequency,
    averageLength:
      indexed.reduce((n, p) => n + p.length, 0) / (indexed.length || 1),
  };
}
export function retrieve(index, query, limit = 6) {
  const original = [...new Set(tokens(query))];
  const expanded = [
    ...new Set(original.flatMap((t) => expansions[t] || [])),
  ].filter((t) => !original.includes(t));
  const terms = [
    ...original.map((term) => ({ term, weight: 1 })),
    ...expanded.map((term) => ({ term, weight: 0.35 })),
  ];
  if (!terms.length) return [];
  return index.pages
    .map((page) => {
      let score = 0;
      for (const { term, weight } of terms) {
        const tf = page.frequencies.get(term) || 0;
        if (!tf) continue;
        const df = index.documentFrequency.get(term) || 0;
        const idf = Math.log(1 + (index.pages.length - df + 0.5) / (df + 0.5));
        score +=
          (weight * idf * tf * 2.2) /
          (tf + 1.2 * (0.25 + (0.75 * page.length) / index.averageLength));
      }
      return {
        page: page.page,
        printedPage: page.printedPage,
        text: page.text,
        score,
      };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
export async function extractPdf(bytes) {
  if (!bytes?.length || bytes.length > MAX_PDF_BYTES)
    throw new ServiceError("REPORT_SIZE_INVALID");
  if (!Buffer.from(bytes).subarray(0, 5).equals(Buffer.from("%PDF-")))
    throw new ServiceError("REPORT_FORMAT_INVALID");
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const info = await parser.getInfo();
    if (info.total > 300) throw new ServiceError("REPORT_TOO_LONG");
    const result = await parser.getText();
    const pages = result.pages.map((p) => {
      const text = p.text.replace(/\u0000/g, "").trim();
      const firstLine =
        text
          .split("\n")
          .map((s) => s.trim())
          .find(Boolean) || "";
      return {
        page: p.num,
        printedPage: /^(\d{1,3}|[ivxlcdm]{1,7})$/i.test(firstLine)
          ? firstLine
          : null,
        text,
      };
    });
    if (pages.reduce((n, p) => n + p.text.length, 0) < 500)
      throw new ServiceError("REPORT_NEEDS_OCR");
    return {
      pages,
      index: createIndex(pages),
      pageCount: result.total,
      imageHeavyPages: pages
        .filter((p) => p.text.length < 150)
        .map((p) => p.page),
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError("REPORT_EXTRACTION_FAILED");
  } finally {
    await parser.destroy();
  }
}
export function createReportStore(
  download,
  { ttlMs = 5 * 60_000, extract = extractPdf } = {},
) {
  let cached;
  let pending;
  let expiresAt = 0;
  return {
    async get() {
      if (cached && Date.now() < expiresAt) return cached;
      if (!pending)
        pending = (async () => {
          const report = await extract(await download());
          cached = report;
          expiresAt = Date.now() + ttlMs;
          return report;
        })().finally(() => {
          pending = undefined;
        });
      return pending;
    },
    isReady() {
      return !!cached && Date.now() < expiresAt;
    },
  };
}
