import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Volume2, VolumeX, Zap } from "lucide-react";
import {
  playLightningThunderSound,
  playReactorPowerUpSound,
} from "../../lib/soundFx";

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
            <stop stopColor="#e9ff9d" />
            <stop offset=".23" stopColor="#c4ff52" />
            <stop offset=".72" stopColor="#527423" />
            <stop offset="1" stopColor="#141d0c" />
          </radialGradient>
          <filter id={compact ? "glow-small" : "glow-large"}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <g className="outer-orbit">
          <circle
            cx="300"
            cy="300"
            r="254"
            fill="none"
            stroke="#9da783"
            strokeOpacity=".22"
            strokeDasharray="1 9"
            strokeWidth="6"
          />
          <circle
            cx="300"
            cy="300"
            r="241"
            fill="none"
            stroke="#c6ff68"
            strokeOpacity=".25"
          />
          <path
            d="M300 59 A241 241 0 0 1 541 300 M300 541 A241 241 0 0 1 59 300"
            fill="none"
            stroke="#c6ff68"
            strokeWidth="3"
          />
        </g>
        <g className="inner-orbit">
          <circle
            cx="300"
            cy="300"
            r="215"
            fill="none"
            stroke="#4c573d"
            strokeWidth="20"
            strokeDasharray="1 12"
          />
          <circle
            cx="300"
            cy="300"
            r="195"
            fill="#0b100b"
            stroke="#758757"
            strokeWidth="2"
          />
          <circle
            cx="300"
            cy="300"
            r="179"
            fill="none"
            stroke="#b8e977"
            strokeOpacity=".45"
            strokeWidth="8"
            strokeDasharray="54 18 2 18"
          />
        </g>
        <g className="reactor-shell">
          <circle
            cx="300"
            cy="300"
            r="153"
            fill="#141c10"
            stroke="#7c9d4f"
            strokeWidth="1"
          />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              transform={`rotate(${i * 30} 300 300)`}
              d="M291 150 L309 150 L320 174 L308 195 L292 195 L280 174Z"
              fill="#2c3920"
              stroke="#789a47"
              strokeWidth=".8"
            />
          ))}
          <circle
            cx="300"
            cy="300"
            r="111"
            fill="#0a1007"
            stroke="#b5ef65"
            strokeWidth="2"
          />
          <circle
            cx="300"
            cy="300"
            r="98"
            fill="none"
            stroke="#8cb940"
            strokeWidth="4"
            strokeDasharray="2 8"
          />
        </g>
        <circle
          className="core-light"
          cx="300"
          cy="300"
          r="79"
          fill={`url(#${compact ? "core-small" : "core-large"})`}
        />
        <path
          d="M316 244 L270 308 H298 L283 355 L334 287 H306Z"
          fill="#e8ffc9"
        />
        <g
          fill="none"
          stroke="#dcffaf"
          strokeWidth="1.5"
          className="reactor-arcs"
        >
          <path d="M153 185 L192 210 L180 236 L219 255 L210 282 L223 294" />
          <path d="M388 321 L408 340 L400 374 L441 391 L450 420" />
          <path d="M318 191 L326 166 L310 139 L335 108" />
        </g>
        <g stroke="#7a8864" strokeWidth="1">
          <path d="M300 20V45 M300 555V580 M20 300H45 M555 300H580" />
          <path d="M95 95L113 113 M487 487L505 505 M95 505L113 487 M487 113L505 95" />
        </g>
      </svg>
      {!compact && (
        <>
          <div className="reactor-tag tag-top">
            <span className="status-dot" /> CORE ONLINE <b>50.00 Hz</b>
          </div>
          <div className="reactor-tag tag-bottom">
            <span>ENERGY BALANCE</span>
            <b>
              OPTIMAL <Zap size={12} />
            </b>
          </div>
          <span className="reactor-coordinate">SYS / 01 — AUTONOMOUS CORE</span>
        </>
      )}
    </div>
  );
}

export function ElectricCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
        .matches
    )
      return;
    const move = (e: PointerEvent) => {
      if (cursor.current) {
        cursor.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
        cursor.current.style.opacity = "1";
        cursor.current.classList.toggle(
          "cursor-active",
          !!(e.target as HTMLElement).closest("button,a,input"),
        );
      }
    };
    const hide = () => {
      if (cursor.current) cursor.current.style.opacity = "0";
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
    };
  }, []);
  return (
    <div className="electric-cursor" ref={cursor} aria-hidden="true">
      <span />
    </div>
  );
}

export function PowerIntro({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<"standby" | "charging">("standby");
  const [sound, setSound] = useState(false);
  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    skip.current?.focus();
  }, []);
  useEffect(() => {
    if (stage !== "charging") return;
    const blast = window.setTimeout(() => {
      if (sound) playLightningThunderSound();
    }, 1050);
    const end = window.setTimeout(onFinish, reduced ? 200 : 2450);
    return () => {
      clearTimeout(blast);
      clearTimeout(end);
    };
  }, [stage, sound, onFinish, reduced]);
  return (
    <motion.div
      className={`power-intro ${stage}`}
      role="dialog"
      aria-modal="true"
      aria-label="VOLT-IQ power sequence"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
      transition={{ duration: 0.5 }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onFinish();
      }}
    >
      <div className="intro-grid" />
      <div className="intro-top">
        <span className="wordmark">
          <Zap /> VOLT<span>—</span>IQ
        </span>
        <button ref={skip} onClick={onFinish} className="text-button">
          Skip intro <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="intro-center">
        <span className="eyebrow">AUTONOMOUS ENERGY SYSTEM / V.01</span>
        <Reactor compact />
        <h1>
          {stage === "charging"
            ? "POWERING POSSIBILITY."
            : "IT STARTS WITH A SPARK."}
        </h1>
        <p>
          {stage === "charging"
            ? "Establishing the energy link…"
            : "Your energy. A whole new intelligence."}
        </p>
        <div className="intro-actions">
          <button
            className="lime-button"
            disabled={stage === "charging"}
            onClick={() => {
              setStage("charging");
              if (sound) playReactorPowerUpSound();
            }}
          >
            {stage === "charging" ? "Initializing core" : "Power on"}{" "}
            <Zap size={16} />
          </button>
          <button
            className="sound-button"
            disabled={stage === "charging"}
            aria-pressed={sound}
            onClick={() => setSound((v) => !v)}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />} Sound{" "}
            {sound ? "on" : "off"}
          </button>
        </div>
        <div className="boot-track">
          <span />
        </div>
      </div>
      <svg
        className="intro-lightning"
        viewBox="0 0 1400 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 50L340 230 290 280 530 390 700 450 915 340 880 285 1400 30 M700 450L520 650 560 700 300 900 M700 450L910 580 890 645 1200 900" />
      </svg>
      <div className="intro-bottom">
        <span>DESIGNED FOR A BETTER ENERGY FUTURE</span>
        <span>PRESS ESC TO SKIP</span>
      </div>
    </motion.div>
  );
}

export { AnimatePresence };
