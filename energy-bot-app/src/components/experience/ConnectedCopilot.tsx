import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Bot,
  BookOpen,
  FileText,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  apiConfigured,
  askAssistant,
  getReportStatus,
  languageOptions,
} from "../../lib/chatApi";
import type { ChatMode, Citation, ReportStatus } from "../../lib/chatApi";
import { VoiceControls } from "./VoiceControls";
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  language?: string;
  error?: boolean;
};
const prompts: Record<ChatMode, string[]> = {
  report: [
    "What savings does the report estimate for BLDC fans?",
    "What faults were found in the APFC panels?",
    "What is the campus solar capacity?",
  ],
  electrical: [
    "Explain power factor with a practical example.",
    "What is the difference between kW and kWh?",
    "How does a transformer work?",
  ],
};
const welcomes: Record<ChatMode, string> = {
  report:
    "Ask about the Saranathan College energy audit. Answers use extracted report passages with PDF page references. Charts and scanned pages may need manual review.",
  electrical:
    "Ask about circuits, machines, power systems, electronics, or energy efficiency. General explanations use AI knowledge; switch to Audit report for questions about your PDF.",
};
export function ConnectedCopilot({ demo }: { demo: ReactNode }) {
  const [mode, setMode] = useState<ChatMode | "demo">("report");
  const [language, setLanguage] = useState("auto");
  const [conversations, setConversations] = useState<
    Record<ChatMode, Message[]>
  >({ report: [], electrical: [] });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState<ReportStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [checking, setChecking] = useState(apiConfigured);
  const [reload, setReload] = useState(0);
  const pending = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const messages = mode === "demo" ? [] : conversations[mode];
  useEffect(() => {
    if (mode !== "report" || !apiConfigured) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    let active = true;
    getReportStatus(controller.signal)
      .then((result) => {
        if (active) setReport(result);
      })
      .catch((error) => {
        if (!active) return;
        setStatusError(
          controller.signal.aborted
            ? "The report service took too long to respond. Try again in a moment."
            : error.message,
        );
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setChecking(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [mode, reload]);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (!messages.length) return;
    end.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [messages.length, busy]);
  const send = async (question: string) => {
    if (mode === "demo" || !question.trim() || lock.current) return;
    const activeMode = mode;
    lock.current = true;
    setBusy(true);
    setInput("");
    setNotice("");
    const history = conversations[activeMode]
      .filter((m) => !m.error)
      .slice(-6)
      .map(({ role, text }) => ({ role, text }));
    const user: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: question.trim(),
    };
    setConversations((c) => ({ ...c, [activeMode]: [...c[activeMode], user] }));
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 110000);
    try {
      const result = await askAssistant(
        { question: user.text, mode: activeMode, language, history },
        controller.signal,
      );
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.answer,
        citations: result.citations,
        language: result.language,
      };
      setConversations((c) => ({
        ...c,
        [activeMode]: [...c[activeMode], reply],
      }));
    } catch (error) {
      const text = controller.signal.aborted
        ? "The request timed out or was cancelled. Please try again."
        : error instanceof Error
          ? error.message
          : "The request could not be completed.";
      setConversations((c) => ({
        ...c,
        [activeMode]: [
          ...c[activeMode],
          { id: crypto.randomUUID(), role: "assistant", text, error: true },
        ],
      }));
    } finally {
      clearTimeout(timeout);
      lock.current = false;
      pending.current = null;
      setBusy(false);
    }
  };
  return (
    <>
      <div className="chat-mode-tabs" aria-label="Conversation mode">
        {(
          [
            ["report", "Audit report"],
            ["electrical", "Electrical Q&A"],
            ["demo", "Microgrid demo"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            disabled={busy}
            aria-pressed={mode === value}
            onClick={() => {
              if (value === mode) return;
              if (value === "report") {
                setChecking(apiConfigured);
                setReport(null);
                setStatusError("");
              }
              setMode(value);
              setInput("");
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "demo" ? (
        demo
      ) : (
        <div className="copilot-layout connected-copilot">
          <div className="copilot-copy">
            <div className="eyebrow">
              <span>04 /</span> YOUR ELECTRICAL INTELLIGENCE COMPANION
            </div>
            <div className="copilot-symbol">
              {mode === "report" ? <BookOpen size={40} /> : <Bot size={40} />}
              <span className="status-dot" />
            </div>
            <h2>
              {mode === "report" ? (
                <>
                  Your audit.
                  <br />
                  <span>Answers with evidence.</span>
                </>
              ) : (
                <>
                  Every electrical question.
                  <br />
                  <span>A clearer understanding.</span>
                </>
              )}
            </h2>
            <p>
              {mode === "report"
                ? "Explore the report in your language. Check the original source beside every cited answer."
                : "From circuit fundamentals to power systems. Ask, learn, and explore in your language."}
            </p>
            <div className="copilot-trust">
              <ShieldCheck size={16} />
              {mode === "report"
                ? "Source quotations checked against extracted text."
                : "AI explanations. Verify before practical use."}
            </div>
            {mode === "report" && (
              <div className="report-connection" role="status">
                <FileText size={16} />
                <div>
                  <strong>SCE Energy Audit · 2025–2026</strong>
                  <span>
                    {!apiConfigured
                      ? "Report service awaiting connection"
                      : checking
                        ? "Connecting to the report library…"
                        : statusError
                          ? "Report unavailable"
                          : report
                            ? `${report.pageCount} pages · ${report.modelConfigured ? "Ready for questions" : "AI service awaiting connection"}`
                            : "Awaiting report"}
                  </span>
                  {report && report.imageHeavyPages.length > 0 && (
                    <small>
                      {report.imageHeavyPages.length} image-heavy pages may need
                      manual review.
                    </small>
                  )}
                  {statusError && <small>{statusError}</small>}
                </div>
                {apiConfigured && (
                  <button
                    className="icon-button"
                    aria-label="Retry report connection"
                    disabled={checking}
                    onClick={() => {
                      setChecking(true);
                      setStatusError("");
                      setReport(null);
                      setReload((v) => v + 1);
                    }}
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>
            )}
            <div className="prompt-list">
              {prompts[mode].map((q) => (
                <button disabled={busy} key={q} onClick={() => void send(q)}>
                  {q}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          </div>
          <div className="chat-panel">
            <div className="chat-heading">
              <span className="chat-avatar">
                <Zap size={19} />
              </span>
              <div>
                <strong>Electra AI</strong>
                <span>
                  {mode === "report"
                    ? "Audit report assistant"
                    : "Electrical knowledge assistant"}
                </span>
              </div>
              <VoiceControls
                onTranscript={setInput}
                reply={
                  messages
                    .filter((m) => m.role === "assistant" && !m.error)
                    .at(-1)?.text || ""
                }
                onNotice={setNotice}
                languageCode={
                  language === "auto"
                    ? messages.filter((m) => m.language).at(-1)?.language ||
                      "en-IN"
                    : language
                }
              />
            </div>
            <div className="chat-language">
              <label htmlFor="reply-language">Reply language</label>
              <select
                id="reply-language"
                value={language}
                disabled={busy}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languageOptions.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="chat-messages"
              data-lenis-prevent
              role="log"
              aria-live="polite"
              aria-label="AI conversation"
            >
              <div className="chat-message assistant">
                <span className="message-label">Electra AI</span>
                <p>{welcomes[mode]}</p>
              </div>
              {messages.map((m) => (
                <div
                  className={`chat-message ${m.role} ${m.error ? "chat-error" : ""}`}
                  key={m.id}
                >
                  {m.role === "assistant" && (
                    <span className="message-label">
                      {m.error ? "SERVICE NOTICE" : "Electra AI"}
                    </span>
                  )}
                  <p dir="auto">{m.text}</p>
                  {m.citations?.map((c, i) => (
                    <details className="source-citation" key={`${c.page}-${i}`}>
                      <summary>
                        <FileText size={13} />
                        PDF page {c.page}
                        {c.printedPage ? ` · printed ${c.printedPage}` : ""}
                      </summary>
                      <blockquote>{c.quote}</blockquote>
                      <small>{c.filename}</small>
                    </details>
                  ))}
                </div>
              ))}
              {busy && (
                <div className="thinking">
                  <span />
                  <span />
                  <span />
                  <small>
                    {mode === "report"
                      ? "Reading the relevant report pages…"
                      : "Preparing your answer…"}
                  </small>
                </div>
              )}
              <div ref={end} />
            </div>
            {notice && (
              <div className="voice-notice" role="status">
                {notice}
              </div>
            )}
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                aria-label="Ask Electra AI"
                placeholder={
                  mode === "report"
                    ? "Ask about your energy audit…"
                    : "Ask an electrical question…"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
              />
              <button
                aria-label="Send AI question"
                disabled={busy || !input.trim()}
              >
                <ArrowUpRight size={21} />
              </button>
            </form>
            <div className="chat-disclaimer">
              <span>
                {mode === "report"
                  ? "PDF PAGES, NOT SIMULATED TELEMETRY"
                  : "GENERAL AI KNOWLEDGE"}
              </span>
              {busy && (
                <button type="button" onClick={() => pending.current?.abort()}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
