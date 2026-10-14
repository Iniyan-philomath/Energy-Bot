import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  Activity,
  ArrowDown,
  ArrowDownLeft,
  ArrowUpRight,
  Battery,
  Bot,
  Car,
  Check,
  Cpu,
  Leaf,
  Menu,
  Plus,
  Power,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from "lucide-react";
import {
  AnimatePresence,
  ElectricCursor,
  PowerIntro,
  Reactor,
} from "./components/experience/ElectricExperience";
import { playElectricClickSound, playHudChirpSound } from "./lib/soundFx";
import { VoiceControls } from "./components/experience/VoiceControls";
import "./App.css";
const currentYear = new Date().getFullYear();

gsap.registerPlugin(ScrollTrigger);
const initialDevices = [
  {
    id: "ev",
    name: "EV charging",
    detail: "Wallbox · Garage",
    watts: 3200,
    max: 7200,
    active: false,
    icon: Car,
  },
  {
    id: "climate",
    name: "Climate control",
    detail: "Heat pump · Main zone",
    watts: 1400,
    max: 2400,
    active: true,
    icon: Wind,
  },
  {
    id: "water",
    name: "Water heating",
    detail: "Thermal storage · Utility",
    watts: 850,
    max: 1800,
    active: true,
    icon: Battery,
  },
  {
    id: "server",
    name: "Home network",
    detail: "Essential load · Always on",
    watts: 450,
    max: 650,
    active: true,
    icon: Cpu,
  },
];
type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  action?: "optimize" | "ev" | "battery";
  done?: boolean;
};
const periods = ["Today", "Week", "Month"] as const;
type Period = (typeof periods)[number];
const chartData: Record<
  Period,
  { solar: number[]; load: number[]; labels: string[]; produced: string }
> = {
  Today: {
    solar: [
      0, 0, 0, 0, 0, 0, 2, 7, 12, 15, 12, 19, 17, 20, 16, 15, 10, 5, 2, 0, 0, 0,
      0, 0,
    ],
    load: [
      4, 3, 3, 3, 3, 4, 6, 8, 8, 7, 9, 8, 11, 9, 10, 8, 9, 12, 10, 8, 6, 5, 4,
      4,
    ],
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
    produced: "18.4",
  },
  Week: {
    solar: [8, 12, 7, 15, 10, 18, 16, 12, 19, 14, 20, 17, 12, 18],
    load: [5, 7, 6, 9, 8, 10, 8, 7, 12, 10, 9, 11, 8, 10],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    produced: "128.8",
  },
  Month: {
    solar: [
      11, 9, 14, 17, 10, 15, 18, 12, 16, 19, 14, 20, 15, 18, 12, 16, 19, 15, 20,
      16, 18, 14, 17, 20, 16, 19, 15, 18, 20, 17,
    ],
    load: [
      6, 8, 7, 9, 8, 10, 7, 9, 11, 8, 9, 12, 10, 8, 11, 7, 9, 12, 10, 11, 8, 10,
      9, 12, 10, 8, 11, 9, 10, 12,
    ],
    labels: ["01", "05", "10", "15", "20", "25", "30"],
    produced: "552.0",
  },
};
function EnergyChart({ period }: { period: Period }) {
  const data = chartData[period];
  const path = (values: number[]) =>
    values
      .map(
        (v, i) =>
          `${i ? "L" : "M"}${(i * 700) / (values.length - 1)},${145 - v * 6}`,
      )
      .join(" ");
  return (
    <div className="energy-chart">
      <div className="chart-scale">
        <span>6 kW</span>
        <span>4 kW</span>
        <span>2 kW</span>
        <span>0</span>
      </div>
      <div className="plot">
        <svg
          viewBox="0 0 700 160"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${period} simulated solar generation and consumption chart`}
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#c6f66b" stopOpacity=".22" />
              <stop offset="1" stopColor="#c6f66b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[25, 65, 105, 145].map((y) => (
            <line
              key={y}
              x1="0"
              x2="700"
              y1={y}
              y2={y}
              stroke="#30332c"
              strokeDasharray="3 6"
            />
          ))}
          <motion.path
            key={`${period}-area`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            d={`${path(data.solar)} L700,155 L0,155 Z`}
            fill="url(#chart-fill)"
          />
          <motion.path
            key={`${period}-solar`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
            d={path(data.solar)}
            fill="none"
            stroke="#c5f578"
            strokeWidth="2.5"
          />
          <path
            d={path(data.load)}
            fill="none"
            stroke="#8b92ad"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
        <div className="chart-times">
          {data.labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
export default function App() {
  const [intro, setIntro] = useState(() => {
    try {
      return !sessionStorage.getItem("electra-intro");
    } catch {
      return true;
    }
  });
  const [sound, setSound] = useState(false);
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [devices, setDevices] = useState(initialDevices);
  const [solar, setSolar] = useState(4.8);
  const [batteryDischarge, setBatteryDischarge] = useState(false);
  const [period, setPeriod] = useState<Period>("Today");
  const [optimized, setOptimized] = useState(false);
  const [toast, setToast] = useState("");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "Your energy, decoded. Ask me about solar generation, peak tariffs, battery reserve, or EV charging. I’m working with your simulated microgrid.",
    },
  ]);
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendLock = useRef(false);
  const total =
    0.6 +
    devices.filter((d) => d.active).reduce((n, d) => n + d.watts / 1000, 0);
  const grid = solar - total + (batteryDischarge ? 3.2 : -1.2);
  const finishIntro = useCallback(() => {
    setIntro(false);
    try {
      sessionStorage.setItem("electra-intro", "1");
    } catch {
      /* Session storage may be unavailable. */
    }
  }, []);
  const notify = (message: string) => {
    setToast(message);
    if (sound) playHudChirpSound();
  };
  const optimize = () => {
    setDevices((v) =>
      v.map((d) =>
        d.id === "ev"
          ? { ...d, active: false }
          : d.id === "climate"
            ? { ...d, watts: 1100 }
            : d.id === "water"
              ? { ...d, watts: 600 }
              : d,
      ),
    );
    setOptimized(true);
    notify("Loads optimized. EV charging deferred to the off-peak window.");
  };
  useEffect(() => {
    const t = setInterval(
      () =>
        setSolar((s) =>
          Math.max(4.2, Math.min(5.4, s + (Math.random() - 0.5) * 0.08)),
        ),
      4000,
    );
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(
    () => () => {
      if (responseTimer.current) clearTimeout(responseTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (messages.length > 1)
      chatEnd.current?.scrollIntoView({
        behavior: reduced ? "instant" : "smooth",
        block: "nearest",
      });
  }, [messages, reduced]);
  useEffect(() => {
    if (intro || reduced) return;
    const lenis = new Lenis({ duration: 1.05, anchors: true });
    let frame: number;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    lenis.on("scroll", ScrollTrigger.update);
    const context = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 28,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.utils
        .toArray<HTMLElement>(".reveal")
        .forEach((el) =>
          gsap.from(el, {
            y: 35,
            opacity: 0,
            duration: 0.8,
            scrollTrigger: { trigger: el, start: "top 94%", once: true },
          }),
        );
      gsap.to(".hero-art", {
        y: 70,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, root);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      context.revert();
    };
  }, [intro, reduced]);
  useEffect(() => {
    document.body.style.overflow = intro ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [intro]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-10% 0px -55% 0px" },
    );
    ["overview", "energy-flow", "devices", "copilot"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  const ask = (query: string) => {
    if (!query.trim() || sendLock.current) return;
    sendLock.current = true;
    setInput("");
    setThinking(true);
    setMessages((m) => [
      ...m,
      { id: Date.now(), role: "user", text: query.trim() },
    ]);
    responseTimer.current = setTimeout(() => {
      const q = query.toLowerCase();
      let text = `Your simulated solar output is ${solar.toFixed(2)} kW and demand is ${total.toFixed(2)} kW. ${grid >= 0 ? "You’re exporting" : "You’re importing"} ${Math.abs(grid).toFixed(2)} kW. Try asking about solar, tariffs, EV charging, or battery reserve.`;
      let action: Message["action"];
      if (/pdf|report|audit|document/.test(q))
        text =
          "Document Q&A is the next phase. This frontend demo does not yet read uploaded audit reports. You can currently explore the simulated energy system.";
      else if (/ev|car|charg/.test(q)) {
        text =
          "Shift EV charging to 02:00–06:00 at the simulated off-peak tariff of $0.08/kWh. I can switch the charger off now and mark it for that window. This demo does not control real hardware.";
        action = "ev";
      } else if (/tariff|peak|cost|optimi/.test(q)) {
        text =
          "The demo peak tariff is $0.36/kWh versus $0.08/kWh off-peak. Reduce flexible loads now: set climate control to 1.1 kW, water heating to 0.6 kW, and defer EV charging.";
        action = "optimize";
      } else if (/battery|backup|reserve/.test(q)) {
        text =
          "Your simulated 13.5 kWh battery has an 88% charge: approximately 11.88 kWh. At a steady 1.2 kW essential load, that is about 9.9 hours before conversion losses and minimum reserve. You can simulate a 3.2 kW discharge.";
        action = "battery";
      } else if (/solar|generat|surplus/.test(q))
        text = `Solar is generating ${solar.toFixed(2)} kW. Your active loads plus baseline demand use ${total.toFixed(2)} kW. ${batteryDischarge ? "The battery supplies 3.2 kW." : "The battery absorbs 1.2 kW."} Your net grid ${grid >= 0 ? "export" : "import"} is ${Math.abs(grid).toFixed(2)} kW.`;
      setMessages((m) => [
        ...m,
        { id: Date.now(), role: "assistant", text, action },
      ]);
      setThinking(false);
      sendLock.current = false;
      if (sound) playHudChirpSound();
    }, 650);
  };
  return (
    <div ref={root} className="electra-app">
      <AnimatePresence>
        {intro && <PowerIntro onFinish={finishIntro} />}
      </AnimatePresence>
      <ElectricCursor />
      <div inert={intro}>
        <a href="#overview" className="skip-link">
          Skip to dashboard
        </a>
        <header className="site-header">
          <a href="#" className="wordmark" aria-label="Electra AI home">
            <span className="brand-icon">
              <Zap size={22} fill="currentColor" />
            </span>
            ELECTRA<span className="wordmark-ai">AI</span>
            <span className="brand-caption">ENERGY INTELLIGENCE</span>
          </a>
          <nav aria-label="Main navigation" className={menu ? "nav-open" : ""}>
            {[
              ["Overview", "overview"],
              ["Energy flow", "energy-flow"],
              ["Devices", "devices"],
              ["AI copilot", "copilot"],
            ].map(([label, id], i) => (
              <a
                aria-current={activeSection === id ? "location" : undefined}
                className={activeSection === id ? "nav-selected" : ""}
                key={id}
                href={`#${id}`}
                onClick={() => setMenu(false)}
              >
                {label}
                {i === 3 && <span className="tiny-new">AI</span>}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <span className="system-live">
              <span className="status-dot" /> System online
            </span>
            <button
              className="icon-button audio-toggle"
              aria-label={sound ? "Mute sound effects" : "Enable sound effects"}
              aria-pressed={sound}
              onClick={() => {
                if (!sound) playElectricClickSound();
                setSound(!sound);
              }}
            >
              {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
        <main>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-grid" />
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="status-dot" />
                <span>THE NEXT GENERATION OF ENERGY</span>
                <span className="kicker-version">V.01</span>
              </div>
              <h1 id="hero-title">
                POWER.
                <br />
                WITH A<br />
                <span>HIGHER IQ.</span>
              </h1>
              <p>
                A smarter connection between your energy
                <br className="desktop-break" /> and everything it powers.
              </p>
              <div className="hero-buttons">
                <a className="lime-button" href="#overview">
                  Enter command center <ArrowUpRight size={18} />
                </a>
                <a className="round-link" href="#copilot">
                  <span>
                    <Bot size={19} />
                  </span>
                  Meet your copilot
                </a>
              </div>
              <div className="hero-proof">
                <div className="proof-icons">
                  <Sun size={16} />
                  <Battery size={16} />
                  <Zap size={16} />
                </div>
                <span>One ecosystem. Every electron accounted for.</span>
              </div>
            </div>
            <div className="hero-art">
              <span className="art-caption">
                <span>INTELLIGENCE AT THE CORE</span>
                <span>FIG. 001</span>
              </span>
              <Reactor />
              <div className="art-bottom">
                <span>LIVE ENERGY ORCHESTRATION</span>
                <span>
                  <span className="status-dot" /> ALL SYSTEMS NOMINAL
                </span>
              </div>
            </div>
            <div className="hero-foot">
              <a href="#overview">
                <span className="scroll-indicator">
                  <ArrowDown size={13} />
                </span>
                SCROLL TO EXPLORE
              </a>
              <span>LESS WASTE. MORE POSSIBILITY.</span>
              <span>01 — 04</span>
            </div>
          </section>
          <div className="capability-strip">
            <span>
              <Sun /> SOLAR INTELLIGENCE
            </span>
            <Plus />
            <span>
              <Battery /> ADAPTIVE STORAGE
            </span>
            <Plus />
            <span>
              <Activity /> REAL-TIME INSIGHTS
            </span>
            <Plus />
            <span>
              <Sparkles /> AUTONOMOUS CONTROL
            </span>
          </div>
          <section className="dashboard section-wrap" id="overview">
            <div className="section-heading reveal">
              <div>
                <div className="eyebrow">
                  <span>01 /</span> COMMAND CENTER
                </div>
                <h2>
                  Your energy. <span>In perspective.</span>
                </h2>
              </div>
              <span className="demo-badge">
                <span className="status-dot" /> LIVE SIMULATION
              </span>
            </div>
            <div className="metric-grid reveal">
              {[
                {
                  label: "Solar generation",
                  value: solar.toFixed(2),
                  unit: "kW",
                  icon: Sun,
                  note: "Harvesting the good stuff",
                  tag: "GENERATING",
                  cls: "solar-metric",
                  trend: "+12.8% vs yesterday",
                },
                {
                  label: "Home consumption",
                  value: total.toFixed(2),
                  unit: "kW",
                  icon: Activity,
                  note: `${devices.filter((d) => d.active).length} devices drawing power`,
                  tag: "ACTIVE",
                  cls: "",
                  trend: optimized
                    ? "AI optimization applied"
                    : "Within your daily average",
                },
                {
                  label: "Battery reserve",
                  value: "88",
                  unit: "%",
                  icon: Battery,
                  note: "11.88 of 13.5 kWh stored",
                  tag: batteryDischarge ? "DISCHARGING" : "CHARGING",
                  cls: "",
                  trend: batteryDischarge
                    ? "Supplying 3.2 kW"
                    : "Charging at 1.2 kW",
                },
                {
                  label: grid >= 0 ? "Grid export" : "Grid import",
                  value: Math.abs(grid).toFixed(2),
                  unit: "kW",
                  icon: Zap,
                  note:
                    grid >= 0
                      ? "Giving a little energy back"
                      : "Balancing your energy needs",
                  tag: grid >= 0 ? "EXPORTING" : "IMPORTING",
                  cls: "",
                  trend: "Grid frequency · 50.00 Hz",
                },
              ].map((m) => (
                <article key={m.label} className={`metric-card ${m.cls}`}>
                  <div className="metric-top">
                    <m.icon size={18} />
                    <span>{m.tag}</span>
                  </div>
                  <p>{m.label}</p>
                  <div className="metric-number">
                    {m.value}
                    <span>{m.unit}</span>
                  </div>
                  <div className="metric-note">{m.note}</div>
                  <div className="metric-trend">
                    <ArrowUpRight size={13} />
                    {m.trend}
                  </div>
                </article>
              ))}
            </div>
            <div className="analytics-grid reveal">
              <article className="panel production-panel">
                <div className="panel-heading">
                  <div>
                    <h3>
                      Energy performance <span className="info-dot">↗</span>
                    </h3>
                    <p>A clearer picture of every kilowatt.</p>
                  </div>
                  <div className="segmented" aria-label="Chart period">
                    {periods.map((p) => (
                      <button
                        key={p}
                        aria-pressed={period === p}
                        className={period === p ? "selected" : ""}
                        onClick={() => setPeriod(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="chart-summary">
                  <strong>
                    {chartData[period].produced}
                    <span> kWh generated</span>
                  </strong>
                  <div className="chart-legend">
                    <span>
                      <i />
                      Solar generation
                    </span>
                    <span>
                      <i />
                      Consumption
                    </span>
                  </div>
                </div>
                <EnergyChart period={period} />
              </article>
              <article className="insight-panel">
                <div className="insight-top">
                  <Sparkles size={18} />
                  <span>THE INTELLIGENCE ADVANTAGE</span>
                </div>
                <h3>
                  A little smarter.
                  <br />A lot more efficient.
                </h3>
                <p>
                  Shift flexible loads to your solar peak and let your energy go
                  further.
                </p>
                <div className="insight-saving">
                  <span>Potential flexible-load reduction</span>
                  <strong>
                    {optimized ? "0.00" : "0.55"} <small>kW</small>
                    <ArrowDownLeft size={24} />
                  </strong>
                </div>
                <button className="light-button" onClick={optimize}>
                  {optimized ? "Optimization applied" : "Optimize my energy"}
                  {optimized ? <Check size={17} /> : <ArrowUpRight size={17} />}
                </button>
                <span className="insight-foot">YOU’RE ALWAYS IN CONTROL.</span>
              </article>
            </div>
          </section>
          <section className="section-wrap flow-section" id="energy-flow">
            <div className="section-heading reveal">
              <div>
                <div className="eyebrow">
                  <span>02 /</span> CONNECTED BY INTELLIGENCE
                </div>
                <h2>
                  Follow the <span>flow.</span>
                </h2>
              </div>
              <p>
                Generation. Storage. Consumption.
                <br />
                Perfectly connected, in real time.
              </p>
            </div>
            <div className="flow-panel reveal">
              <div className="flow-node">
                <span className="node-icon">
                  <Sun />
                </span>
                <span>SOLAR ARRAY</span>
                <strong>
                  {solar.toFixed(2)} <small>kW</small>
                </strong>
                <em>Generating clean energy</em>
              </div>
              <div className="flow-connector">
                <span />
                <Zap size={15} />
              </div>
              <div className="flow-core">
                <div className="flow-core-ring">
                  <Zap size={35} fill="currentColor" />
                </div>
                <span>Electra AI CORE</span>
                <small>Balancing your microgrid</small>
              </div>
              <div className="flow-connector">
                <span />
                <Zap size={15} />
              </div>
              <div className="flow-destinations">
                <div>
                  <Battery size={21} />
                  <span>
                    BATTERY{" "}
                    <small>
                      {batteryDischarge ? "Discharging" : "Charging"}
                    </small>
                  </span>
                  <strong>
                    {batteryDischarge ? "−3.2" : "+1.2"} <small>kW</small>
                  </strong>
                </div>
                <div>
                  <Activity size={21} />
                  <span>
                    HOME <small>Active consumption</small>
                  </span>
                  <strong>
                    {total.toFixed(2)} <small>kW</small>
                  </strong>
                </div>
                <div>
                  <Zap size={21} />
                  <span>
                    GRID{" "}
                    <small>
                      {grid >= 0 ? "Exporting surplus" : "Importing power"}
                    </small>
                  </span>
                  <strong>
                    {Math.abs(grid).toFixed(2)} <small>kW</small>
                  </strong>
                </div>
              </div>
            </div>
          </section>
          <section className="section-wrap" id="devices">
            <div className="section-heading reveal">
              <div>
                <div className="eyebrow">
                  <span>03 /</span> DEVICE ORCHESTRATION
                </div>
                <h2>
                  Small adjustments.
                  <br className="mobile-break" /> <span>Big impact.</span>
                </h2>
              </div>
              <button className="outline-button" onClick={optimize}>
                <Sparkles size={15} />
                {optimized ? "Optimized" : "AI optimize all"}
                <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="device-grid reveal">
              {devices.map((d) => (
                <article
                  className={`device-card ${!d.active ? "device-off" : ""}`}
                  key={d.id}
                >
                  <div className="device-top">
                    <span className="device-icon">
                      <d.icon size={22} />
                    </span>
                    <button
                      className="toggle"
                      role="switch"
                      aria-checked={d.active}
                      aria-label={`Toggle ${d.name}`}
                      onClick={() => {
                        setDevices((v) =>
                          v.map((a) =>
                            a.id === d.id ? { ...a, active: !a.active } : a,
                          ),
                        );
                        setOptimized(false);
                        if (sound) playElectricClickSound();
                      }}
                    >
                      <span />
                    </button>
                  </div>
                  <h3>{d.name}</h3>
                  <p>{d.detail}</p>
                  <div className="device-watts">
                    {d.active ? (d.watts / 1000).toFixed(2) : "0.00"}{" "}
                    <span>kW</span>
                    <span className="device-state">
                      {d.active ? "ACTIVE" : "STANDBY"}
                    </span>
                  </div>
                  <label className="device-range">
                    <span>
                      Power allocation <SlidersHorizontal size={12} />
                    </span>
                    <input
                      type="range"
                      min="100"
                      max={d.max}
                      step="50"
                      value={d.watts}
                      aria-label={`${d.name} power allocation`}
                      onChange={(e) => {
                        setDevices((v) =>
                          v.map((a) =>
                            a.id === d.id
                              ? { ...a, watts: Number(e.target.value) }
                              : a,
                          ),
                        );
                        setOptimized(false);
                      }}
                    />
                    <span>
                      <small>0.1 kW</small>
                      <small>
                        {(d.watts / 1000).toFixed(2)} /{" "}
                        {(d.max / 1000).toFixed(1)} kW
                      </small>
                    </span>
                  </label>
                </article>
              ))}
            </div>
          </section>
          <section className="section-wrap copilot-section" id="copilot">
            <div className="copilot-layout reveal">
              <div className="copilot-copy">
                <div className="eyebrow">
                  <span>04 /</span> YOUR ENERGY ALLY
                </div>
                <div className="copilot-symbol">
                  <Bot size={40} />
                  <span className="status-dot" />
                </div>
                <h2>
                  Complex energy.
                  <br />
                  <span>Simple conversation.</span>
                </h2>
                <p>
                  No spreadsheets. No guesswork.
                  <br />
                  Just ask your personal energy copilot.
                </p>
                <div className="copilot-trust">
                  <ShieldCheck size={16} /> Demo insights. You make the
                  decisions.
                </div>
                <div className="prompt-list">
                  {[
                    "How can I lower my energy costs?",
                    "How much battery backup do I have?",
                    "What is my solar surplus?",
                  ].map((q) => (
                    <button key={q} disabled={thinking} onClick={() => ask(q)}>
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
                    <strong>Electra AI Copilot</strong>
                    <span>
                      <i className="status-dot" /> Online · Demo advisor
                    </span>
                  </div>
                  <VoiceControls
                    onTranscript={setInput}
                    reply={
                      messages.filter((m) => m.role === "assistant").at(-1)
                        ?.text || ""
                    }
                    onNotice={notify}
                  />
                </div>
                <div
                  className="chat-messages"
                  data-lenis-prevent
                  role="log"
                  aria-live="polite"
                  aria-label="Copilot conversation"
                >
                  {messages.map((m) => (
                    <div className={`chat-message ${m.role}`} key={m.id}>
                      {m.role === "assistant" && (
                        <span className="message-label">Electra AI</span>
                      )}
                      <p>{m.text}</p>
                      {m.action && (
                        <button
                          className="chat-action"
                          disabled={m.done}
                          onClick={() => {
                            if (m.action === "optimize") optimize();
                            else if (m.action === "ev") {
                              setDevices((v) =>
                                v.map((d) =>
                                  d.id === "ev" ? { ...d, active: false } : d,
                                ),
                              );
                              notify(
                                "EV charging deferred to 02:00–06:00 in this simulation.",
                              );
                            } else {
                              setBatteryDischarge(true);
                              notify("Battery discharge simulation activated.");
                            }
                            setMessages((v) =>
                              v.map((a) =>
                                a.id === m.id ? { ...a, done: true } : a,
                              ),
                            );
                          }}
                        >
                          {m.done ? <Check size={14} /> : <Zap size={14} />}{" "}
                          {m.done
                            ? "Applied to simulation"
                            : "Apply to simulation"}
                        </button>
                      )}
                    </div>
                  ))}
                  {thinking && (
                    <div className="thinking">
                      <span />
                      <span />
                      <span />
                      <small>Connecting the dots</small>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                <form
                  className="chat-input"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(input);
                  }}
                >
                  <input
                    aria-label="Ask your energy copilot"
                    placeholder="Ask anything about your energy…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={2000}
                  />
                  <button
                    aria-label="Send message"
                    disabled={!input.trim() || thinking}
                  >
                    <ArrowUpRight size={21} />
                  </button>
                </form>
                <div className="chat-disclaimer">
                  SIMULATED TELEMETRY{" "}
                  <span>POWERED BY CURIOSITY. GUIDED BY DATA.</span>
                </div>
              </div>
            </div>
          </section>
          <section className="impact-strip section-wrap reveal">
            <div>
              <span className="impact-icon">
                <Leaf size={30} />
              </span>
              <div className="eyebrow">
                A LIGHTER FOOTPRINT.
                <br />
                <strong>A brighter future.</strong>
              </div>
            </div>
            <div>
              <strong>
                14.2 <small>kg</small>
              </strong>
              <span>CO₂ avoided today</span>
            </div>
            <div>
              <strong>
                84<small>%</small>
              </strong>
              <span>Clean energy mix</span>
            </div>
            <div>
              <strong>
                5.18 <small>t</small>
              </strong>
              <span>Annual CO₂ projection</span>
            </div>
            <span className="impact-note">
              ILLUSTRATIVE IMPACT
              <br />
              BASED ON DEMO DATA
            </span>
          </section>
        </main>
        <footer className="site-footer">
          <a href="#" className="wordmark">
            <Zap size={22} /> ELECTRA<span className="wordmark-ai">AI</span>
          </a>
          <span>INTELLIGENCE FOR EVERY ELECTRON.</span>
          <button
            className="text-button"
            onClick={() => {
              window.scrollTo({ top: 0 });
              setIntro(true);
            }}
          >
            Replay power sequence <Power size={13} />
          </button>
          <span>© {currentYear} Electra AI</span>
        </footer>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check size={18} />
            {toast}
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
