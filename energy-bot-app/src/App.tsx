/**
 * App.tsx — Electra AI Chat Workspace
 *
 * Full redesign: chat-first, colorful, premium.
 * Removes: thunder intro, coil, hero section, landing-page structure.
 * Preserves: ConnectedCopilot backend connections, device simulation
 *            for the demo mode, toast system.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowUp,
  Battery,
  Bot,
  BookOpen,
  Car,
  Check,
  ChevronLeft,
  Cpu,
  Leaf,
  Menu,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ConnectedCopilot } from "./components/experience/ConnectedCopilot";
import { VoiceControls } from "./components/experience/VoiceControls";
import {
  ElectricCursor,
  LightningStormCanvas,
  PowerIntro,
} from "./components/experience/ElectricExperience";
import {
  playElectricClickSound,
  playHudChirpSound,
  playLightningThunderSound,
} from "./lib/soundFx";
import "./App.css";

/* ─── Constants ─────────────────────────────────────────────────────────── */
type ChatMode = "report" | "electrical" | "demo";

interface ModeItem {
  id: ChatMode;
  label: string;
  Icon: LucideIcon;
  description: string;
}

const MODE_ITEMS: ModeItem[] = [
  { id: "report",     label: "Audit Report",    Icon: BookOpen,  description: "Questions from your PDF" },
  { id: "electrical", label: "Electrical Q&A",  Icon: Zap,       description: "General electrical topics" },
  { id: "demo",       label: "Microgrid Demo",  Icon: Bot,       description: "Simulated home energy" },
];

interface DeviceItem {
  id: string;
  name: string;
  detail: string;
  watts: number;
  max: number;
  active: boolean;
  Icon: LucideIcon;
}

const initialDevices: DeviceItem[] = [
  { id: "ev",      name: "EV charging",    detail: "Wallbox · Garage",        watts: 3200, max: 7200, active: false, Icon: Car      },
  { id: "climate", name: "Climate control",detail: "Heat pump · Main zone",   watts: 1400, max: 2400, active: true,  Icon: Wind     },
  { id: "water",   name: "Water heating",  detail: "Thermal storage · Utility",watts: 850, max: 1800, active: true,  Icon: Battery  },
  { id: "server",  name: "Home network",   detail: "Essential load · Always on",watts: 450, max: 650, active: true,  Icon: Cpu      },
];

type DemoMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  action?: "optimize" | "ev" | "battery";
  done?: boolean;
};

/* ─── Electra Mark ──────────────────────────────────────────────────────── */
function ElectraMark({ size = 28 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.28),
      background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 55%, #14b8a6 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(124,58,237,0.30)",
    }}>
      <Zap size={size * 0.5} color="white" fill="white" />
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────────────────────── */
export default function App() {
  // Theme
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try { return (localStorage.getItem("electra-theme") as "light" | "dark") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
    catch { return "dark"; }
  });

  // Navigation
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [activeMode,   setActiveMode]   = useState<ChatMode>("report");

  // Demo mode state
  const [devices,   setDevices]   = useState(initialDevices);
  const [solar,     setSolar]     = useState(4.8);
  const [batteryDischarge, setBatteryDischarge] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [demoInput, setDemoInput] = useState("");
  const [demoThinking, setDemoThinking] = useState(false);
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([{
    id: 0, role: "assistant",
    text: "Your energy, decoded. Ask me about solar generation, peak tariffs, battery reserve, or EV charging. I'm working with your simulated microgrid.",
  }]);

  const [toast, setToast]   = useState("");
  const [sound, setSound]   = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showLightning, setShowLightning] = useState(false);

  const demoEnd     = useRef<HTMLDivElement>(null);
  const demoInput$  = useRef<HTMLTextAreaElement>(null);
  const demoTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoLock    = useRef(false);
  const reduced     = useReducedMotion();

  const total = 0.6 + devices.filter(d => d.active).reduce((n, d) => n + d.watts / 1000, 0);
  const grid  = solar - total + (batteryDischarge ? 3.2 : -1.2);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("electra-theme", theme); } catch { /* ok */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  // Solar simulation
  useEffect(() => {
    const t = setInterval(() => setSolar(s => Math.max(4.2, Math.min(5.4, s + (Math.random() - 0.5) * 0.08))), 4000);
    return () => clearInterval(t);
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => () => { if (demoTimer.current) clearTimeout(demoTimer.current); }, []);

  // Auto-scroll demo
  useEffect(() => {
    if (demoMessages.length > 1)
      demoEnd.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "nearest" });
  }, [demoMessages, reduced]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (sound) playHudChirpSound();
  }, [sound]);

  const optimize = useCallback(() => {
    setDevices(v => v.map(d =>
      d.id === "ev"      ? { ...d, active: false }
      : d.id === "climate" ? { ...d, watts: 1100 }
      : d.id === "water"   ? { ...d, watts: 600 }
      : d
    ));
    setOptimized(true);
    notify("Loads optimized. EV charging deferred to off-peak window.");
  }, [notify]);

  const askDemo = (query: string) => {
    if (!query.trim() || demoLock.current) return;
    demoLock.current = true;
    setDemoInput("");
    setDemoThinking(true);
    setDemoMessages(m => [...m, { id: Date.now(), role: "user", text: query.trim() }]);
    if (demoInput$.current) demoInput$.current.style.height = "auto";

    demoTimer.current = setTimeout(() => {
      const q = query.toLowerCase();
      let text = `Your simulated solar output is ${solar.toFixed(2)} kW and demand is ${total.toFixed(2)} kW. ${grid >= 0 ? "You're exporting" : "You're importing"} ${Math.abs(grid).toFixed(2)} kW.`;
      let action: DemoMessage["action"];
      if (/pdf|report|audit|document/.test(q))
        text = "Choose Audit Report above to ask about the college PDF. This mode uses simulated household readings only.";
      else if (/ev|car|charg/.test(q)) { text = "Shift EV charging to 02:00–06:00 at the simulated off-peak tariff of $0.08/kWh. This demo does not control real hardware."; action = "ev"; }
      else if (/tariff|peak|cost|optimi/.test(q)) { text = "The demo peak tariff is $0.36/kWh versus $0.08/kWh off-peak. Reduce flexible loads now."; action = "optimize"; }
      else if (/battery|backup|reserve/.test(q)) { text = "Your simulated 13.5 kWh battery has 88% charge (~11.88 kWh). At 1.2 kW essential load, ~9.9 hours of reserve."; action = "battery"; }
      else if (/solar|generat|surplus/.test(q)) text = `Solar is generating ${solar.toFixed(2)} kW. Active loads use ${total.toFixed(2)} kW. Net grid ${grid >= 0 ? "export" : "import"}: ${Math.abs(grid).toFixed(2)} kW.`;
      setDemoMessages(m => [...m, { id: Date.now() + 1, role: "assistant", text, action }]);
      setDemoThinking(false);
      demoLock.current = false;
      if (sound) playHudChirpSound();
    }, 650);
  };

  // ── Demo panel JSX
  const demoPanel = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Metrics strip */}
      <div style={{ display: "flex", gap: 12, padding: "16px 20px 12px", borderBottom: "1px solid var(--border-subtle)", overflowX: "auto", flexShrink: 0 }}>
        {[
          { label: "Solar",   value: `${solar.toFixed(2)} kW`, icon: <Sun size={14} />,      color: "var(--amber-400)" },
          { label: "Load",    value: `${total.toFixed(2)} kW`, icon: <Activity size={14} />, color: "var(--violet-400)" },
          { label: "Battery", value: "88 %",                   icon: <Battery size={14} />,  color: "var(--teal-400)" },
          { label: "Grid",    value: `${grid >= 0 ? "+" : ""}${grid.toFixed(2)} kW`, icon: <Zap size={14} />, color: grid >= 0 ? "var(--success)" : "var(--coral-400)" },
        ].map(m => (
          <div key={m.label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            flexShrink: 0, fontSize: 13,
          }}>
            <span style={{ color: m.color }}>{m.icon}</span>
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{m.label}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
          </div>
        ))}
        <button
          onClick={optimize}
          disabled={optimized}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: "var(--radius-md)",
            background: optimized ? "rgba(16,185,129,0.10)" : "var(--accent-muted)",
            color: optimized ? "var(--success)" : "var(--accent-primary)",
            border: `1px solid ${optimized ? "rgba(16,185,129,0.22)" : "var(--border-medium)"}`,
            fontSize: 13, fontWeight: 600, cursor: optimized ? "default" : "pointer", flexShrink: 0,
          }}
        >
          {optimized ? <Check size={13} /> : <Sparkles size={13} />}
          {optimized ? "Optimized" : "AI Optimize"}
        </button>
      </div>

      {/* Device toggles */}
      <div style={{ display: "flex", gap: 10, padding: "12px 20px", overflowX: "auto", flexShrink: 0, borderBottom: "1px solid var(--border-subtle)" }}>
        {devices.map(d => (
          <div key={d.id} style={{
            display: "flex", flexDirection: "column", gap: 6,
            padding: "10px 14px", borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)", border: `1px solid ${d.active ? "var(--border-medium)" : "var(--border-subtle)"}`,
            minWidth: 140, flexShrink: 0,
            opacity: d.active ? 1 : 0.6,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <d.Icon size={16} color={d.active ? "var(--accent-primary)" : "var(--text-muted)"} />
              <button
                role="switch"
                aria-checked={d.active}
                aria-label={`Toggle ${d.name}`}
                onClick={() => {
                  setDevices(v => v.map(a => a.id === d.id ? { ...a, active: !a.active } : a));
                  setOptimized(false);
                  if (sound) playElectricClickSound();
                }}
                style={{
                  width: 34, height: 18, borderRadius: 9,
                  background: d.active ? "var(--accent-primary)" : "var(--border-medium)",
                  position: "relative", cursor: "pointer", transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: 2, left: d.active ? 16 : 2,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "white", transition: "left 0.2s",
                }} />
              </button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{d.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.detail}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: d.active ? "var(--accent-primary)" : "var(--text-muted)" }}>
              {d.active ? (d.watts / 1000).toFixed(2) : "0.00"} kW
            </div>
            <input
              type="range" min="100" max={d.max} step="50" value={d.watts}
              aria-label={`${d.name} power`}
              onChange={e => { setDevices(v => v.map(a => a.id === d.id ? { ...a, watts: Number(e.target.value) } : a)); setOptimized(false); }}
              style={{ width: "100%", accentColor: "var(--accent-primary)" }}
            />
          </div>
        ))}
      </div>

      {/* Demo chat */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "16px 20px 8px", display: "flex", flexDirection: "column", gap: 8 }}
        role="log" aria-live="polite"
      >
        {demoMessages.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            {m.role === "assistant" && <ElectraMark size={30} />}
            <div style={{
              maxWidth: "72%", padding: "12px 16px", borderRadius: "var(--radius-lg)",
              background: m.role === "user" ? "var(--user-bubble-bg)" : "var(--bg-surface)",
              color: m.role === "user" ? "white" : "var(--text-primary)",
              border: m.role === "assistant" ? "1px solid var(--border-subtle)" : "none",
              fontSize: 15, lineHeight: 1.6, boxShadow: "var(--shadow-xs)",
            }}>
              <p style={{ margin: 0 }}>{m.text}</p>
              {m.action && (
                <button
                  disabled={m.done}
                  onClick={() => {
                    if (m.action === "optimize") optimize();
                    else if (m.action === "ev") { setDevices(v => v.map(d => d.id === "ev" ? { ...d, active: false } : d)); notify("EV charging deferred to 02:00–06:00."); }
                    else { setBatteryDischarge(true); notify("Battery discharge simulation activated."); }
                    setDemoMessages(v => v.map(a => a.id === m.id ? { ...a, done: true } : a));
                  }}
                  className="message-action-btn"
                  style={{ marginTop: 10 }}
                >
                  {m.done ? <Check size={13} /> : <Zap size={13} />}
                  {m.done ? "Applied to simulation" : "Apply to simulation"}
                </button>
              )}
            </div>
          </div>
        ))}
        {demoThinking && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <ElectraMark size={30} />
            <div className="thinking-bubble">
              <div className="thinking-dots">
                <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
              </div>
              <span className="thinking-label">Connecting the dots…</span>
            </div>
          </div>
        )}
        <div ref={demoEnd} />
      </div>

      {/* Demo composer */}
      <div className="composer-area" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="composer-inner">
          <div className="composer-form">
            <textarea
              ref={demoInput$}
              className="composer-input"
              rows={1}
              placeholder="Ask anything about your simulated energy…"
              value={demoInput}
              maxLength={2000}
              onChange={e => { setDemoInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); askDemo(demoInput); } }}
              disabled={demoThinking}
            />
            <div className="composer-actions">
              <VoiceControls
                onTranscript={t => { setDemoInput(t); if (demoInput$.current) demoInput$.current.style.height = "auto"; }}
                reply={demoMessages.filter(m => m.role === "assistant").at(-1)?.text || ""}
                onNotice={msg => notify(msg)}
              />
              <button className="composer-send" aria-label="Send message" disabled={demoThinking || !demoInput.trim()} onClick={() => askDemo(demoInput)}>
                <ArrowUp size={18} />
              </button>
            </div>
          </div>
          <div className="composer-meta">
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <ShieldCheck size={12} />
              Simulated telemetry · Demo advisor
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="electra-app">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Electric Spark Ripple on click */}
      <ElectricCursor />

      {/* Fast 850ms loading thunder strike entrance */}
      <AnimatePresence>
        {showIntro && (
          <PowerIntro onFinish={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* Interactive on-demand lightning storm */}
      {showLightning && <LightningStormCanvas active={true} />}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <nav
        className={`sidebar${!sidebarOpen ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-inner">
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="brand-mark">
              <Zap size={18} fill="white" color="white" />
            </div>
            <div className="brand-text">
              <span className="brand-name">Electra AI</span>
              <span className="brand-subtitle">Energy Intelligence</span>
            </div>
          </div>

          {/* New chat */}
          <button
            className="new-chat-btn"
            onClick={() => { setMobileOpen(false); }}
            aria-label="New conversation"
          >
            <Plus size={15} />
            New conversation
          </button>

          {/* Mode navigation */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">Modes</div>
            {MODE_ITEMS.map(({ id, label, Icon, description }) => (
              <button
                key={id}
                className={`mode-tab${activeMode === id ? " active" : ""}`}
                onClick={() => { setActiveMode(id); setMobileOpen(false); }}
                aria-current={activeMode === id ? "page" : undefined}
              >
                <span className="mode-tab-icon">
                  <Icon size={15} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: activeMode === id ? 700 : 500 }}>{label}</span>
                  <span style={{ display: "block", fontSize: 11, color: activeMode === id ? "var(--accent-primary)" : "var(--text-muted)", marginTop: 1 }}>{description}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Sidebar footer */}
          <div className="sidebar-footer">
            <Leaf size={14} color="var(--teal-500)" />
            <div className="sidebar-footer-text">
              <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>SCE Audit 2025–2026</span>
              <span style={{ fontSize: 11 }}>Saranathan College of Eng.</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Workspace ───────────────────────────────────────────────────── */}
      <div className="workspace" id="main-content">

        {/* Header */}
        <header className="workspace-header">
          {/* Sidebar toggle */}
          <button
            className="header-sidebar-toggle"
            onClick={() => { setSidebarOpen(o => !o); setMobileOpen(o => !o); }}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>

          {/* Title */}
          <div className="header-title-area">
            <div className="header-title">
              <ElectraMark size={22} />
              Electra AI
            </div>
            <div className="header-subtitle">
              <span className="header-report-chip">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal-500)", display: "inline-block" }} />
                {activeMode === "report" ? "Audit Report" : activeMode === "electrical" ? "Electrical Q&A" : "Microgrid Demo"}
              </span>
              Energy audit assistant
            </div>
          </div>

          <div className="header-actions">
            {/* Lightning Strike Trigger */}
            <button
              className="icon-btn"
              onClick={() => {
                setShowLightning(true);
                try { playLightningThunderSound(); } catch { /* ok */ }
                setTimeout(() => setShowLightning(false), 900);
              }}
              aria-label="Ignite electric lightning"
              title="⚡ Strike Electric Lightning"
            >
              <Zap size={16} color="var(--accent-primary)" />
            </button>

            {/* Sound */}
            <button
              className={`icon-btn${sound ? " active" : ""}`}
              onClick={() => { if (!sound) playElectricClickSound(); setSound(s => !s); }}
              aria-label={sound ? "Mute sound" : "Enable sound"}
              title={sound ? "Mute sound effects" : "Enable sound effects"}
            >
              {sound
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              }
            </button>

            {/* Theme */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Chat Region */}
        <div className="chat-region">
          <motion.div
            key="workspace-enter"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <ConnectedCopilot
              demo={demoPanel}
              activeMode={activeMode}
              onModeChange={m => setActiveMode(m as ChatMode)}
            />
          </motion.div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast-container"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22 }}
          >
            <div className="toast" role="status">
              <Check size={15} className="toast-icon" style={{ color: "var(--success)" }} />
              {toast}
              <button className="toast-dismiss" aria-label="Dismiss" onClick={() => setToast("")}>
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
