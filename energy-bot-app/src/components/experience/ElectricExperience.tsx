import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Volume2, VolumeX, Zap } from "lucide-react";
import {
  playElectricClickSound,
  playLightningThunderSound,
  playReactorPowerUpSound,
} from "../../lib/soundFx";

/* --- 1. PROCEDURAL LIGHTNING CANVAS --- */
export function LightningStormCanvas({
  active,
  onStrike,
}: {
  active: boolean;
  onStrike?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particles from impact
    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }
    const sparks: Spark[] = [];

    // Helper: draw fractal branching lightning bolt
    const drawBolt = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      displace: number,
      branchProb = 0.6,
      depth = 0
    ) => {
      if (depth > 5 || displace < 3) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return;
      }
      const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
      const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace;

      drawBolt(x1, y1, midX, midY, displace / 1.75, branchProb, depth + 1);
      drawBolt(midX, midY, x2, y2, displace / 1.75, branchProb, depth + 1);

      if (Math.random() < branchProb && depth < 3) {
        const branchX =
          midX + (Math.random() - 0.5) * displace * 1.8;
        const branchY = midY + Math.random() * displace * 1.6;
        drawBolt(
          midX,
          midY,
          branchX,
          branchY,
          displace / 2,
          branchProb * 0.5,
          depth + 1
        );
      }
    };

    let strikeTimer = 0;
    const strikeTarget = { x: width / 2, y: height / 2 };

    const fireLightningStrike = () => {
      onStrike?.();
      // Spawn impact sparks
      const colors = ["#00ff88", "#00f0ff", "#ffffff", "#e0e7ff", "#facc15"];
      for (let i = 0; i < 90; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 3;
        sparks.push({
          x: strikeTarget.x,
          y: strikeTarget.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: Math.random() * 0.4 + 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 1.5,
        });
      }
    };

    // Initial strike trigger
    const initialTimeout = setTimeout(() => {
      fireLightningStrike();
    }, 400);

    const render = () => {
      // Clear with trail
      ctx.fillStyle = "rgba(5, 8, 7, 0.28)";
      ctx.fillRect(0, 0, width, height);

      strikeTimer++;

      // Flash bolts periodically during active storm
      if (strikeTimer % 18 === 0 || strikeTimer === 25) {
        const startX = width * (0.2 + Math.random() * 0.6);
        const startY = 0;
        const targetX = width / 2 + (Math.random() - 0.5) * 80;
        const targetY = height / 2 + (Math.random() - 0.5) * 60;

        // Outer glow
        ctx.save();
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 10;
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 35;
        drawBolt(startX, startY, targetX, targetY, 130, 0.55);

        // Core bright beam
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.5;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 18;
        drawBolt(startX, startY, targetX, targetY, 130, 0.55);
        ctx.restore();
      }

      // Update and draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.94;
        s.vy *= 0.94;
        s.life -= 0.025;

        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [active, onStrike]);

  return (
    <canvas
      ref={canvasRef}
      className="lightning-storm-canvas"
      aria-hidden="true"
    />
  );
}

/* --- 2. ARC REACTOR 3D / SCI-FI CORE --- */
export function Reactor({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`reactor ${compact ? "reactor-compact" : ""}`}
      aria-hidden="true"
    >
      <div className="reactor-aura" />
      <svg viewBox="0 0 600 600" className="reactor-svg">
        <defs>
          <radialGradient id={compact ? "core-small" : "core-large"}>
            <stop stopColor="#ffffff" offset="0%" />
            <stop offset="25%" stopColor="#00ff88" />
            <stop offset="65%" stopColor="#00f0ff" />
            <stop offset="85%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#050807" />
          </radialGradient>
          <linearGradient id="neon-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="50%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id={compact ? "glow-small" : "glow-large"}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Orbit with Glowing Dash */}
        <g className="outer-orbit">
          <circle
            cx="300"
            cy="300"
            r="260"
            fill="none"
            stroke="url(#neon-ring-grad)"
            strokeOpacity="0.45"
            strokeDasharray="4 14"
            strokeWidth="3"
          />
          <circle
            cx="300"
            cy="300"
            r="242"
            fill="none"
            stroke="#00ff88"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
          <path
            d="M300 58 A242 242 0 0 1 542 300 M300 542 A242 242 0 0 1 58 300"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="4"
            filter={compact ? "url(#glow-small)" : "url(#glow-large)"}
          />
        </g>

        {/* Inner Counter-Rotating Orbit */}
        <g className="inner-orbit">
          <circle
            cx="300"
            cy="300"
            r="215"
            fill="none"
            stroke="#1b2a22"
            strokeWidth="16"
            strokeDasharray="2 12"
          />
          <circle
            cx="300"
            cy="300"
            r="195"
            fill="#070c09"
            stroke="#00ff88"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
          <circle
            cx="300"
            cy="300"
            r="179"
            fill="none"
            stroke="#00f0ff"
            strokeOpacity="0.75"
            strokeWidth="5"
            strokeDasharray="48 20 4 20"
          />
        </g>

        {/* Reactor Mechanical Shroud */}
        <g className="reactor-shell">
          <circle
            cx="300"
            cy="300"
            r="153"
            fill="#0c1410"
            stroke="#00ff88"
            strokeWidth="1.5"
          />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              transform={`rotate(${i * 30} 300 300)`}
              d="M291 148 L309 148 L320 174 L308 196 L292 196 L280 174Z"
              fill="#14261c"
              stroke="#00ff88"
              strokeWidth="1.2"
            />
          ))}
          <circle
            cx="300"
            cy="300"
            r="112"
            fill="#050807"
            stroke="#00f0ff"
            strokeWidth="2.5"
          />
          <circle
            cx="300"
            cy="300"
            r="98"
            fill="none"
            stroke="#00ff88"
            strokeWidth="4"
            strokeDasharray="3 8"
          />
        </g>

        {/* The Core Plasma Light */}
        <circle
          className="core-light"
          cx="300"
          cy="300"
          r="82"
          fill={`url(#${compact ? "core-small" : "core-large"})`}
          filter={compact ? "url(#glow-small)" : "url(#glow-large)"}
        />

        {/* Electric Bolt Symbol in Center */}
        <path
          d="M318 240 L266 312 H302 L282 362 L338 288 H304Z"
          fill="#ffffff"
          filter="drop-shadow(0 0 10px #00ff88)"
        />

        {/* Electrical Lightning Discharge Arcs */}
        <g
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2.5"
          className="reactor-arcs"
        >
          <path d="M153 185 L192 210 L180 236 L219 255 L210 282 L223 294" />
          <path d="M388 321 L408 340 L400 374 L441 391 L450 420" />
          <path d="M318 191 L326 166 L310 139 L335 108" />
        </g>

        {/* Crosshair Measurement Reticles */}
        <g stroke="#00ff88" strokeOpacity="0.4" strokeWidth="1">
          <path d="M300 15V45 M300 555V585 M15 300H45 M555 300H585" />
          <path d="M95 95L115 115 M485 485L505 505 M95 505L115 485 M485 115L505 95" />
        </g>
      </svg>

      {!compact && (
        <>
          <div className="reactor-tag tag-top">
            <span className="status-dot neon-pulse" /> CORE ONLINE{" "}
            <b>50.00 Hz · 1,250 kW</b>
          </div>
          <div className="reactor-tag tag-bottom">
            <span>ENERGY BALANCE</span>
            <b>
              OPTIMAL <Zap size={13} className="text-neon-cyan animate-pulse" />
            </b>
          </div>
          <span className="reactor-coordinate">
            SYS / 01 — AUTONOMOUS PLASMA CORE
          </span>
        </>
      )}
    </div>
  );
}

/* --- 3. DYNAMIC ELECTRIC SPARK CURSOR --- */
export function ElectricCursor() {
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
        .matches
    )
      return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let animId: number;

    const move = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorDot.current) {
        cursorDot.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        cursorDot.current.style.opacity = "1";
      }
      const target = (e.target as HTMLElement).closest("button, a, input, [role='button'], .metric-card");
      if (cursorRing.current) {
        cursorRing.current.classList.toggle("cursor-hovering", !!target);
      }
    };

    const handleClick = (e: MouseEvent) => {
      playElectricClickSound();
      // Spawn ripple spark
      const ripple = document.createElement("div");
      ripple.className = "cursor-spark-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    };

    const hide = () => {
      if (cursorDot.current) cursorDot.current.style.opacity = "0";
      if (cursorRing.current) cursorRing.current.style.opacity = "0";
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (cursorRing.current) {
        cursorRing.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        cursorRing.current.style.opacity = "1";
      }
      animId = requestAnimationFrame(animateRing);
    };

    animId = requestAnimationFrame(animateRing);
    window.addEventListener("pointermove", move);
    window.addEventListener("click", handleClick);
    document.addEventListener("pointerleave", hide);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("pointerleave", hide);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div className="electric-cursor-dot" ref={cursorDot} aria-hidden="true" />
      <div className="electric-cursor-ring" ref={cursorRing} aria-hidden="true">
        <span className="cursor-spark-arc" />
      </div>
    </>
  );
}

/* --- 4. CINEMATIC THUNDER & LIGHTNING INTRO --- */
export function PowerIntro({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<"standby" | "striking" | "ignited">("standby");
  const [sound, setSound] = useState(true);
  const [voltage, setVoltage] = useState(0);
  const [strobe, setStrobe] = useState(false);

  // Sound and Strike Trigger
  const triggerThunderStrike = useCallback(() => {
    setStage("striking");
    playReactorPowerUpSound();

    // Voltage ramp
    let v = 0;
    const voltInterval = setInterval(() => {
      v += Math.floor(Math.random() * 85 + 40);
      if (v > 1250) {
        v = 1250;
        clearInterval(voltInterval);
      }
      setVoltage(v);
    }, 40);

    // Strobe & Thunder Detonation at 850ms
    setTimeout(() => {
      setStrobe(true);
      if (sound) {
        playLightningThunderSound();
      }
      setTimeout(() => setStrobe(false), 220);
      setTimeout(() => setStrobe(true), 320);
      setTimeout(() => setStrobe(false), 550);
    }, 850);

    // Fully ignited state
    setTimeout(() => {
      setStage("ignited");
    }, 1900);

    // Transition into main page
    setTimeout(() => {
      onFinish();
    }, reduced ? 400 : 3200);
  }, [sound, onFinish, reduced]);

  // Keyboard escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onFinish]);

  return (
    <motion.div
      className={`power-intro-cinematic ${stage} ${strobe ? "strobe-active" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Electra AI High Voltage Ignition"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Lightning Canvas Storm */}
      <LightningStormCanvas active={stage === "striking"} />

      {/* Screen flash strobe overlay */}
      <div className={`screen-flash-overlay ${strobe ? "flash-on" : ""}`} />

      {/* Grid cyber background */}
      <div className="intro-cyber-grid" />

      {/* Ambient glowing plasma orbs */}
      <div className="ambient-plasma-orb plasma-green" />
      <div className="ambient-plasma-orb plasma-cyan" />

      {/* Top Bar */}
      <div className="intro-top">
        <div className="wordmark">
          <Zap className="text-neon-green" /> ELECTRA
          <span className="wordmark-ai">AI</span>
          <span className="intro-badge">HIGH VOLTAGE GRID</span>
        </div>
        <div className="intro-controls">
          <button
            className="sound-toggle-btn"
            onClick={() => setSound((s) => !s)}
            aria-label={sound ? "Disable audio" : "Enable audio"}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Sound {sound ? "ON" : "OFF"}</span>
          </button>
          <button onClick={onFinish} className="skip-intro-btn">
            Skip intro <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Center Cinematic Stage */}
      <div className="intro-center">
        <div className="intro-telemetry-header">
          <span className="live-status-pill">
            <span className="status-dot neon-pulse" /> STATUS:{" "}
            {stage === "standby"
              ? "STORM CHARGING READY"
              : stage === "striking"
              ? "⚡ THUNDER STRIKE IN PROGRESS"
              : "CORE SYNCHRONIZED"}
          </span>
          <span className="voltage-counter">
            VOLTAGE: <strong>{voltage} kV</strong> / 1250 kV
          </span>
        </div>

        {/* Central High Voltage Reactor */}
        <div className="intro-reactor-wrap">
          <Reactor compact />
        </div>

        <motion.div
          className="intro-headline-wrap"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="cinematic-title">
            {stage === "standby" && (
              <>
                POWER. <span className="text-gradient-electric">UNLEASHED.</span>
              </>
            )}
            {stage === "striking" && (
              <>
                <span className="text-gradient-strike">LIGHTNING STRIKE</span>{" "}
                DETECTED!
              </>
            )}
            {stage === "ignited" && (
              <>
                ALL SYSTEMS <span className="text-gradient-green">NOMINAL.</span>
              </>
            )}
          </h1>
          <p className="cinematic-subtitle">
            {stage === "standby"
              ? "Click below to initiate the thunderstorm power sequence and electrify the microgrid."
              : stage === "striking"
              ? "Ionizing atmospheric plasma. Energy transfer at 1.25 Gigawatts..."
              : "Autonomous energy intelligence is active. Welcome to Electra AI."}
          </p>
        </motion.div>

        {/* High Voltage Trigger Button */}
        <div className="intro-actions-cinematic">
          {stage === "standby" ? (
            <button
              className="thunder-strike-button"
              onClick={triggerThunderStrike}
            >
              <Zap size={22} className="strike-icon animate-bounce" />
              <span>⚡ INITIATE THUNDER STRIKE</span>
              <span className="strike-glow" />
            </button>
          ) : (
            <div className="ignition-progress-wrap">
              <div className="ignition-track">
                <div
                  className="ignition-fill"
                  style={{ width: `${(voltage / 1250) * 100}%` }}
                />
              </div>
              <span className="ignition-label">
                SYNCHRONIZING ELECTRONS · {Math.round((voltage / 1250) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="intro-bottom">
        <span>ELECTRA AI · NEXT-GENERATION AUTONOMOUS MICROGRID OS</span>
        <span>PRESS ESC TO ENTER IMMEDIATELY</span>
      </div>
    </motion.div>
  );
}

export { AnimatePresence };
