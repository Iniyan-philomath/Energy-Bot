/**
 * ConnectedCopilot.tsx
 * Full-page chat workspace: sidebar-integrated conversation panel for
 * Audit report, Electrical Q&A, and Microgrid demo modes.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  BookOpen,
  Bot,
  ChevronDown,
  FileText,
  Mic,
  MicOff,
  RefreshCw,
  ShieldCheck,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import {
  apiConfigured,
  askAssistant,
  getReportStatus,
  languageOptions,
} from "../../lib/chatApi";
import type { ChatMode, Citation, ReportStatus } from "../../lib/chatApi";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  language?: string;
  error?: boolean;
};

const PROMPTS: Record<ChatMode, { label: string; icon: string; chipClass: string }[]> = {
  report: [
    { label: "Summarize my audit",              icon: "📋", chipClass: "chip-icon-violet" },
    { label: "Where are the biggest energy losses?", icon: "⚡", chipClass: "chip-icon-coral" },
    { label: "Explain the power-factor findings", icon: "📈", chipClass: "chip-icon-blue" },
    { label: "Which improvements to prioritize?", icon: "🎯", chipClass: "chip-icon-teal" },
  ],
  electrical: [
    { label: "Explain power factor with an example", icon: "🔌", chipClass: "chip-icon-violet" },
    { label: "What is the difference between kW and kWh?", icon: "💡", chipClass: "chip-icon-blue" },
    { label: "How does a transformer work?",     icon: "🔧", chipClass: "chip-icon-teal" },
    { label: "What causes low power factor?",    icon: "📊", chipClass: "chip-icon-coral" },
  ],
};

const WELCOMES: Record<ChatMode, string> = {
  report:
    "Ask about the Saranathan College energy audit. Answers include PDF page references and verbatim source quotes. Charts and scanned pages may need manual review.",
  electrical:
    "Ask about circuits, machines, power systems, electronics, or energy efficiency. For report-specific questions, switch to Audit report mode.",
};

/* ─── Voice Controls (inline, lightweight) ───────────────────────────── */
type Rec = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};

function VoiceBtn({
  onTranscript, reply, onNotice, languageCode = "en-IN",
}: {
  onTranscript: (t: string) => void;
  reply: string;
  onNotice: (m: string) => void;
  languageCode?: string;
}) {
  const [listening, setListening]   = useState(false);
  const [speaking,  setSpeaking]    = useState(false);
  const recRef = useRef<Rec | null>(null);

  useEffect(() => {
    if (!speaking || !reply || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(reply);
    u.lang = languageCode;
    const v = window.speechSynthesis.getVoices()
      .find(x => x.lang.split("-")[0] === languageCode.split("-")[0]);
    if (v) u.voice = v;
    u.rate = 1;
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [reply, speaking, languageCode]);

  useEffect(() => () => {
    recRef.current?.abort();
  }, []);

  const listen = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const api = window as unknown as {
      SpeechRecognition?: new () => Rec;
      webkitSpeechRecognition?: new () => Rec;
    };
    const SR = api.SpeechRecognition || api.webkitSpeechRecognition;
    if (!SR) { onNotice("Voice input is unavailable in this browser. Please type your question."); return; }
    const inst = new SR();
    recRef.current = inst;
    inst.lang = languageCode;
    inst.continuous = false;
    inst.interimResults = false;
    inst.onresult = e => { onTranscript(e.results[0][0].transcript); setListening(false); };
    inst.onerror  = () => { setListening(false); onNotice("Microphone unavailable. Please type your question."); };
    inst.onend    = () => setListening(false);
    try { inst.start(); setListening(true); }
    catch { setListening(false); onNotice("Microphone unavailable."); }
  };

  return (
    <div className="voice-controls" style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button
        className={`icon-button${listening ? " mic-active" : ""}`}
        onClick={listen}
        aria-label={listening ? "Stop listening" : "Dictate a question"}
        title={listening ? "Stop listening" : "Speak your question"}
      >
        {listening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      <button
        className="icon-button"
        onClick={() => setSpeaking(s => !s)}
        aria-label={speaking ? "Mute voice replies" : "Enable voice replies"}
        title={speaking ? "Mute voice replies" : "Enable voice replies"}
      >
        {speaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </div>
  );
}

/* ─── Electra Mark (small SVG identity) ─────────────────────────────── */
function ElectraMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: Math.round(size * 0.28),
        background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 55%, #14b8a6 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(124,58,237,0.30)",
      }}
    >
      <Zap size={size * 0.5} color="white" fill="white" />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function ConnectedCopilot({
  demo,
  activeMode,
  onModeChange,
}: {
  demo: ReactNode;
  activeMode?: ChatMode | "demo";
  onModeChange?: (m: ChatMode | "demo") => void;
}) {
  const [mode, setMode] = useState<ChatMode | "demo">(activeMode ?? "report");
  const [language, setLanguage]       = useState("auto");
  const [conversations, setConversations] = useState<Record<ChatMode, Message[]>>({
    report: [], electrical: [],
  });
  const [input, setInput]     = useState("");
  const [busy,  setBusy]      = useState(false);
  const [notice, setNotice]   = useState("");
  const [report, setReport]   = useState<ReportStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [checking, setChecking]       = useState(apiConfigured);
  const [reload, setReload]           = useState(0);
  const [atBottom, setAtBottom]       = useState(true);

  const pending  = useRef<AbortController | null>(null);
  const lock     = useRef(false);
  const endRef   = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const reduced   = useReducedMotion();

  const messages = mode === "demo" ? [] : conversations[mode as ChatMode];

  // Sync external mode prop
  useEffect(() => {
    if (activeMode && activeMode !== mode) setMode(activeMode);
  }, [activeMode]);

  // Load report status when in report mode
  useEffect(() => {
    if (mode !== "report" || !apiConfigured) return;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 90000);
    let alive = true;
    getReportStatus(ctrl.signal)
      .then(r => { if (alive) setReport(r); })
      .catch(e => { if (!alive) return;
        setStatusError(ctrl.signal.aborted
          ? "The report service took too long to respond. Try again in a moment."
          : e.message);
      })
      .finally(() => { clearTimeout(timeout); if (alive) setChecking(false); });
    return () => { alive = false; clearTimeout(timeout); ctrl.abort(); };
  }, [mode, reload]);

  useEffect(() => () => pending.current?.abort(), []);

  // Auto-scroll
  useEffect(() => {
    if (atBottom && !reduced) {
      endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [messages.length, busy, atBottom, reduced]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(dist < 120);
  };

  const jumpToLatest = () => {
    endRef.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "nearest" });
    setAtBottom(true);
  };

  const changeMode = (m: ChatMode | "demo") => {
    if (m === mode) return;
    if (m === "report") { setChecking(apiConfigured); setReport(null); setStatusError(""); }
    setMode(m);
    setInput("");
    setNotice("");
    onModeChange?.(m);
  };

  // Auto-grow textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  const send = async (question: string) => {
    if (mode === "demo" || !question.trim() || lock.current) return;
    const activeMode = mode as ChatMode;
    lock.current = true;
    setBusy(true);
    setInput("");
    setNotice("");
    // Reset textarea height
    if (inputRef.current) { inputRef.current.style.height = "auto"; }
    setAtBottom(true);

    const history = conversations[activeMode]
      .filter(m => !m.error)
      .slice(-6)
      .map(({ role, text }) => ({ role, text }));

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: question.trim() };
    setConversations(c => ({ ...c, [activeMode]: [...c[activeMode], userMsg] }));

    const ctrl = new AbortController();
    pending.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 110000);

    try {
      const result = await askAssistant(
        { question: userMsg.text, mode: activeMode, language, history },
        ctrl.signal,
      );
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.answer,
        citations: result.citations,
        language: result.language,
      };
      setConversations(c => ({ ...c, [activeMode]: [...c[activeMode], reply] }));
    } catch (err) {
      const text = ctrl.signal.aborted
        ? "The request timed out or was cancelled. Please try again."
        : err instanceof Error ? err.message : "The request could not be completed.";
      setConversations(c => ({
        ...c,
        [activeMode]: [...c[activeMode], { id: crypto.randomUUID(), role: "assistant", text, error: true }],
      }));
    } finally {
      clearTimeout(timeout);
      lock.current = false;
      pending.current = null;
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const hasMessages = messages.length > 0;

  // Status dot for report
  const reportDotClass = !apiConfigured ? "offline"
    : checking ? "loading"
    : statusError ? "error"
    : report?.ready ? "ready"
    : "loading";

  const reportLabel = !apiConfigured
    ? "Report service not connected"
    : checking ? "Connecting to report…"
    : statusError ? "Report unavailable"
    : report ? `${report.pageCount} pages · ${report.modelConfigured ? "Ready" : "AI not connected"}`
    : "Awaiting report";

  return (
    <>
      {/* ── Chat region header (mode tabs + language) ── */}
      <div className="language-select">
        {/* Mode tabs — compact pill row */}
        <div style={{ display: "flex", gap: 6, flex: 1 }}>
          {([ ["report", "Audit Report", BookOpen], ["electrical", "Electrical Q&A", Zap], ["demo", "Microgrid Demo", Bot] ] as const).map(
            ([value, label, Icon]) => (
              <button
                key={value}
                disabled={busy}
                aria-pressed={mode === value}
                onClick={() => changeMode(value)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 13, fontWeight: mode === value ? 700 : 500,
                  background: mode === value ? "var(--accent-primary)" : "transparent",
                  color: mode === value ? "white" : "var(--text-tertiary)",
                  border: mode === value ? "1.5px solid var(--accent-primary)" : "1.5px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "all var(--t-fast)",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={13} />
                <span style={{ display: "none" }} className="tab-label-sm">{label}</span>
                <span>{label}</span>
              </button>
            )
          )}
        </div>

        {/* Language selector (only in AI modes) */}
        {mode !== "demo" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <label htmlFor="reply-language" className="language-label">Language</label>
            <select
              id="reply-language"
              className="language-dropdown"
              value={language}
              disabled={busy}
              onChange={e => setLanguage(e.target.value)}
            >
              {languageOptions.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Demo mode ── */}
      {mode === "demo" ? (
        <div style={{ flex: 1, overflow: "auto" }}>{demo}</div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

          {/* ── Welcome / Empty state ── */}
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                className="welcome-state"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
              >
                <div className="welcome-bg">
                  <div className="welcome-blob welcome-blob-1" />
                  <div className="welcome-blob welcome-blob-2" />
                  <div className="welcome-blob welcome-blob-3" />
                </div>

                <div className="welcome-content">
                  {/* Electra animated mark */}
                  <motion.div
                    className="electra-mark"
                    initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <div className="electra-mark-pulse" />
                    <Zap size={32} color="white" fill="white" />
                  </motion.div>

                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                  >
                    <h1 className="welcome-heading">
                      Hi, I'm{" "}
                      <span className="accent-gradient">Electra</span>.
                    </h1>
                    <p className="welcome-subheading">
                      {mode === "report"
                        ? "Ask questions about your energy audit, understand findings, and explore improvements — with evidence from the source PDF."
                        : "Ask about circuits, power systems, machines, or energy efficiency. Explanations you can understand and act on."}
                    </p>
                  </motion.div>

                  {/* Report context badge */}
                  {mode === "report" && (
                    <motion.div
                      className="welcome-report-status"
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.2 }}
                    >
                      <span className={`status-dot ${reportDotClass}`} />
                      <FileText size={13} />
                      <span>SCE Energy Audit · 2025–2026 · {reportLabel}</span>
                      {apiConfigured && (
                        <button
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
                          aria-label="Retry report connection"
                          disabled={checking}
                          onClick={() => { setChecking(true); setStatusError(""); setReport(null); setReload(v => v + 1); }}
                        >
                          <RefreshCw size={12} style={checking ? { animation: "spin 1s linear infinite" } : {}} />
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Starter prompts */}
                  <motion.div
                    className="prompt-chips"
                    style={{ marginTop: 28 }}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                  >
                    {PROMPTS[mode as ChatMode].map(({ label, icon, chipClass }) => (
                      <button
                        key={label}
                        className="prompt-chip"
                        disabled={busy}
                        onClick={() => void send(label)}
                        aria-label={`Ask: ${label}`}
                      >
                        <span className={`prompt-chip-icon ${chipClass}`}>
                          <span style={{ fontSize: 15 }}>{icon}</span>
                        </span>
                        <span className="prompt-chip-label">{label}</span>
                      </button>
                    ))}
                  </motion.div>

                  {/* Trust line */}
                  <motion.div
                    style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    <ShieldCheck size={13} />
                    {mode === "report"
                      ? "Answers grounded in extracted PDF pages. Quotations verified."
                      : "AI explanations. Verify before practical use."}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Messages stream ── */}
          {hasMessages && (
            <div
              ref={scrollRef}
              className="messages-scroll"
              role="log"
              aria-live="polite"
              aria-label="AI conversation"
              onScroll={handleScroll}
            >
              <div className="messages-inner">
                {/* Static welcome message at top */}
                <MessageBubble
                  msg={{ id: "welcome", role: "assistant", text: WELCOMES[mode as ChatMode] }}
                  reduced={!!reduced}
                  isFirst
                />

                {messages.map((msg, i) => (
                  <MessageBubble key={msg.id} msg={msg} reduced={!!reduced} index={i} />
                ))}

                {/* Thinking */}
                {busy && (
                  <motion.div
                    className="thinking-row"
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ElectraMark size={32} />
                    <div className="thinking-bubble">
                      <div className="thinking-dots">
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                      </div>
                      <span className="thinking-label">
                        {mode === "report" ? "Reading relevant report pages…" : "Preparing your answer…"}
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={endRef} />
              </div>
            </div>
          )}

          {/* Jump to latest */}
          <AnimatePresence>
            {hasMessages && !atBottom && (
              <motion.button
                className="jump-to-latest"
                onClick={jumpToLatest}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                aria-label="Jump to latest message"
              >
                <ChevronDown size={14} />
                Latest message
              </motion.button>
            )}
          </AnimatePresence>

          {/* Voice notice */}
          {notice && (
            <div className="voice-notice" role="status">{notice}</div>
          )}

          {/* ── Composer ── */}
          <div className="composer-area">
            <div className="composer-inner">
              <div className="composer-form">
                <textarea
                  ref={inputRef}
                  className="composer-input"
                  aria-label={mode === "report" ? "Ask about your energy audit" : "Ask an electrical question"}
                  placeholder={mode === "report" ? "Ask Electra about your energy audit…" : "Ask Electra an electrical question…"}
                  value={input}
                  rows={1}
                  maxLength={2000}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={busy}
                />
                <div className="composer-actions">
                  <VoiceBtn
                    onTranscript={t => { setInput(t); if (inputRef.current) { inputRef.current.style.height = "auto"; inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 180) + "px"; } }}
                    reply={messages.filter(m => m.role === "assistant" && !m.error).at(-1)?.text || ""}
                    onNotice={setNotice}
                    languageCode={language === "auto"
                      ? messages.filter(m => m.language).at(-1)?.language || "en-IN"
                      : language}
                  />
                  <button
                    className="composer-send"
                    aria-label="Send message"
                    disabled={busy || !input.trim()}
                    onClick={() => void send(input)}
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>

              <div className="composer-meta">
                <span>Shift + Enter for new line · Enter to send</span>
                {busy && (
                  <button className="cancel-btn" type="button" onClick={() => pending.current?.abort()}>
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── MessageBubble ───────────────────────────────────────────────────── */
function MessageBubble({
  msg, reduced, index = 0, isFirst = false,
}: {
  msg: Message;
  reduced: boolean;
  index?: number;
  isFirst?: boolean;
}) {
  return (
    <motion.div
      className={`message-row ${msg.role}`}
      initial={reduced || isFirst ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: isFirst ? 0 : Math.min(index * 0.04, 0.12) }}
    >
      {msg.role === "assistant" && <ElectraMark size={32} />}

      <div className="message-bubble-wrap">
        {msg.role === "assistant" && !isFirst && (
          <span className="message-sender">Electra AI</span>
        )}
        {isFirst && (
          <span className="message-sender">Electra AI</span>
        )}

        <div className={`message-bubble${msg.error ? " error-bubble" : ""}`}>
          <div className="message-text">
            {/* Render plain text with paragraph breaks */}
            {msg.text.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Citations */}
          {msg.citations && msg.citations.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {msg.citations.map((c, i) => (
                <details className="citation-details" key={`${c.page}-${i}`}>
                  <summary className="citation-summary">
                    <FileText size={12} />
                    PDF page {c.page}
                    {c.printedPage ? ` · printed page ${c.printedPage}` : ""}
                  </summary>
                  <div className="citation-body">
                    <blockquote className="citation-quote">"{c.quote}"</blockquote>
                    <div className="citation-file">{c.filename}</div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
