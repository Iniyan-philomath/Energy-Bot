export type ChatMode = "report" | "electrical";
export type Citation = {
  page: number;
  printedPage: string | null;
  quote: string;
  filename: string;
};
export type ApiReply = {
  answer: string;
  citations: Citation[];
  supported: boolean;
  language: string;
  mode: ChatMode;
};
export type ReportStatus = {
  ready: boolean;
  filename: string;
  pageCount: number;
  imageHeavyPages: number[];
  modelConfigured: boolean;
};
export const languageOptions = [
  ["auto", "Auto-detect"],
  ["en-IN", "English"],
  ["ta-IN", "தமிழ் · Tamil"],
  ["hi-IN", "हिन्दी · Hindi"],
  ["te-IN", "తెలుగు · Telugu"],
  ["kn-IN", "ಕನ್ನಡ · Kannada"],
  ["ml-IN", "മലയാളം · Malayalam"],
  ["mr-IN", "मराठी · Marathi"],
  ["gu-IN", "ગુજરાતી · Gujarati"],
  ["bn-IN", "বাংলা · Bengali"],
  ["pa-IN", "ਪੰਜਾਬੀ · Punjabi"],
  ["or-IN", "ଓଡ଼ିଆ · Odia"],
  ["as-IN", "অসমীয়া · Assamese"],
  ["ur-IN", "اردو · Urdu"],
  ["sa-IN", "संस्कृत · Sanskrit"],
  ["ne-IN", "नेपाली · Nepali"],
  ["mai-IN", "मैथिली · Maithili"],
  ["ks-IN", "Kashmiri"],
  ["sd-IN", "Sindhi"],
  ["kok-IN", "Konkani"],
  ["doi-IN", "Dogri"],
  ["mni-IN", "Manipuri"],
  ["sat-IN", "Santali"],
  ["brx-IN", "Bodo"],
] as const;
const base = String(
  import.meta.env.VITE_API_BASE_URL || "https://electra-ai-api.onrender.com",
).replace(/\/+$/, "");
export const apiConfigured = true;
const errors: Record<string, string> = {
  REPORT_NOT_CONFIGURED:
    "The audit library is not connected yet. Please try again after setup.",
  REPORT_UNAVAILABLE:
    "The report could not be read from storage. Please try again later.",
  REPORT_NEEDS_OCR:
    "This PDF needs image-to-text processing before it can be searched.",
  REPORT_EXTRACTION_FAILED:
    "The PDF could not be processed. Please ask the site owner to check the file.",
  MODEL_NOT_CONFIGURED:
    "The AI service is not connected yet. The microgrid demo is still available.",
  MODEL_UNAVAILABLE:
    "The AI service is temporarily unavailable. Please try again.",
  MODEL_BUSY: "The AI service is busy. Please wait a minute and try again.",
  RATE_LIMITED:
    "You have reached the request limit. Please wait a minute and try again.",
  SERVER_BUSY:
    "Several questions are being answered. Please try again shortly.",
  CITATION_CHECK_FAILED:
    "I could not verify the source quotations for that answer. Please rephrase your question and try again.",
  MODEL_RESPONSE_INVALID:
    "The AI returned an incomplete response. Please try again.",
  ORIGIN_NOT_ALLOWED:
    "The chat service is not connected to this site address yet.",
};
async function request<T>(
  path: string,
  signal: AbortSignal,
  body?: unknown,
): Promise<T> {
  if (!base)
    throw new Error(
      "The report and AI services are not connected yet. You can still use Microgrid demo.",
    );
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      signal,
      method: body ? "POST" : "GET",
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      "Cannot reach the chat service. It may be starting up; please try again in a moment.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      errors[data?.error] ||
        "The chat service could not complete this request. Please try again.",
    );
  if (!data) throw new Error("The chat service returned an invalid response.");
  return data as T;
}
export const getReportStatus = (signal: AbortSignal) =>
  request<ReportStatus>("/api/report", signal);
export const askAssistant = (
  body: {
    question: string;
    mode: ChatMode;
    language: string;
    history: { role: "user" | "assistant"; text: string }[];
  },
  signal: AbortSignal,
) => request<ApiReply>("/api/chat", signal, body);
