import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Volume2, VolumeX, Zap } from "lucide-react";
import {
  playElectricClickSound,
  playLightningThunderSound,
  playReactorPowerUpSound,
} from "../../lib/soundFx";

export { AnimatePresence };

/* ─── 1. Branching Lightning Bolt Generator on Canvas ────────────────────── */
function createBolt(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  displace: number,
  branchProbability: number
): { x1: number; y1: number; x2: number; y2: number }[] {
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  function drawSegment(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    disp: number
  ) {
    if (disp < 6) {
      segments.push({ x1: ax, y1: ay, x2: bx, y2: by });
      return;
    }

    const midX = (ax + bx) / 2 + (Math.random() - 0.5) * disp;
    const midY = (ay + by) / 2 + (Math.random() - 0.5) * disp;

    drawSegment(ax, ay, midX, midY, disp / 1.8);
    drawSegment(midX, midY, bx, by, disp / 1.8);

    if (Math.random() < branchProbability) {
      const branchAngle = (Math.random() - 0.5) * 0.95;
      const len = Math.hypot(bx - ax, by - ay) * 0.5;
      const angle = Math.atan2(by - ay, bx - ax) + branchAngle;
      const endX = midX + Math.cos(angle) * len;
      const endY = midY + Math.sin(angle) * len;
      drawSegment(midX, midY, endX, endY, disp / 2.2);
    }
  }

  drawSegment(x1, y1, x2, y2, displace);
  return segments;
}

export function LightningStormCanvas({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    interface ActiveBolt {
      segments: { x1: number; y1: number; x2: number; y2: number }[];
      alpha: number;
      width: number;
      color: string;
    }

    const bolts: ActiveBolt[] = [];

    const spawnBolt = () => {
      const startX = width * (0.15 + Math.random() * 0.7);
      const startY = 0;
      const endX = width / 2 + (Math.random() - 0.5) * (width * 0.4);
      const endY = height * (0.45 + Math.random() * 0.5);

      const segments = createBolt(startX, startY, endX, endY, 130, 0.5);
      bolts.push({
        segments,
        alpha: 1.0,
        width: Math.random() * 3 + 2.5,
        color: Math.random() > 0.4 ? "#00f0ff" : "#00ff88",
      });
    };

    spawnBolt();
    const t1 = setTimeout(spawnBolt, 350);
    const t2 = setTimeout(spawnBolt, 850);
    const t3 = setTimeout(spawnBolt, 1500);
    const t4 = setTimeout(spawnBolt, 2100);
    const t5 = setTimeout(spawnBolt, 2700);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        ctx.save();
        ctx.strokeStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = b.width;
        ctx.globalAlpha = Math.max(0, b.alpha);

        ctx.beginPath();
        for (const seg of b.segments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, b.width * 0.45);
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        b.alpha -= 0.035;
        if (b.alpha <= 0) {
          bolts.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
      }}
      aria-hidden="true"
    />
  );
}

/* ─── 2. 3D Sci-Fi Energy Reactor Core (WebGL / SVG 3D Layer) ────────────── */
export function Reactor({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: compact ? 120 : 160,
        height: compact ? 120 : 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          inset: -15,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.3) 0%, rgba(124, 58, 237, 0.15) 50%, transparent 75%)",
          filter: "blur(18px)",
          animation: "reactor-pulse 2.5s ease-in-out infinite",
        }}
      />
      <svg
        viewBox="0 0 200 200"
        style={{
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 0 16px rgba(0, 240, 255, 0.6))",
        }}
      >
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="rgba(0, 240, 255, 0.45)"
          strokeWidth="2"
          strokeDasharray="6 8"
          style={{ transformOrigin: "center", animation: "cursor-spin 10s linear infinite" }}
        />
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="rgba(124, 58, 237, 0.65)"
          strokeWidth="3"
          strokeDasharray="18 10 4 10"
          style={{ transformOrigin: "center", animation: "cursor-spin 7s linear infinite reverse" }}
        />
        <circle
          cx="100"
          cy="100"
          r="54"
          fill="none"
          stroke="rgba(0, 255, 136, 0.85)"
          strokeWidth="2.5"
          strokeDasharray="30 14"
          style={{ transformOrigin: "center", animation: "cursor-spin 4s linear infinite" }}
        />
        <circle
          cx="100"
          cy="100"
          r="38"
          fill="url(#core-glow)"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <defs>
          <radialGradient id="core-glow">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#00f0ff" />
            <stop offset="80%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#050814" />
          </radialGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Zap size={compact ? 24 : 32} color="#ffffff" fill="#ffffff" />
      </div>
    </div>
  );
}

/* ─── 3. Full 3-Second Cinematic Thunder Strike Loading Entrance ─────────── */
export function PowerIntro({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const [strobe, setStrobe] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voltage, setVoltage] = useState(0);
  const [stage, setStage] = useState<"standby" | "striking" | "ignited">("standby");

  const startLightningSequence = useCallback(() => {
    setStage("striking");

    // Force play sound immediately (user gesture or auto)
    try {
      playReactorPowerUpSound();
    } catch {
      /* ok */
    }

    // Voltage ramp up to 1250 kV across 3 seconds
    let curV = 0;
    const voltInterval = setInterval(() => {
      curV += Math.floor(Math.random() * 55 + 32);
      if (curV >= 1250) {
        curV = 1250;
        clearInterval(voltInterval);
      }
      setVoltage(curV);
    }, 60);

    // Initial Thunder Strike at 600ms
    setTimeout(() => {
      setStrobe(true);
      try {
        if (soundEnabled) playLightningThunderSound();
      } catch {
        /* ok */
      }
      setTimeout(() => setStrobe(false), 240);
    }, 600);

    // Second Powerful Thunder Strike at 1500ms
    setTimeout(() => {
      setStrobe(true);
      try {
        if (soundEnabled) playLightningThunderSound();
      } catch {
        /* ok */
      }
      setTimeout(() => setStrobe(false), 280);
    }, 1500);

    // Fully ignited state at 2300ms
    setTimeout(() => {
      setStage("ignited");
    }, 2300);

    // Hold for full 3.4 seconds before revealing the active chat workspace
    setTimeout(() => {
      clearInterval(voltInterval);
      onFinish();
    }, 3400);
  }, [soundEnabled, onFinish]);

  useEffect(() => {
    if (reduced) {
      onFinish();
      return;
    }

    // Auto-trigger sequence on load
    startLightningSequence();
  }, [reduced, startLightningSequence, onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "radial-gradient(circle at center, #0e1726 0%, #050811 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* 3-Second Branching Lightning Canvas */}
      <LightningStormCanvas active={stage === "striking"} />

      {/* Screen flash strobe */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.45) 0%, rgba(124, 58, 237, 0.3) 50%, transparent 80%)",
          opacity: strobe ? 1 : 0,
          transition: "opacity 0.08s ease",
          pointerEvents: "none",
        }}
      />

      {/* Top controls: Sound ON and Skip */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 28,
          display: "flex",
          gap: 12,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => {
            setSoundEnabled((s) => !s);
            if (!soundEnabled) {
              try {
                playReactorPowerUpSound();
                playLightningThunderSound();
              } catch {
                /* ok */
              }
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: soundEnabled ? "#00f0ff" : "#94a3b8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Sound: {soundEnabled ? "ON" : "OFF"}
        </button>

        <button
          onClick={onFinish}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(124, 58, 237, 0.35)",
            border: "1px solid rgba(124, 58, 237, 0.5)",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          Skip Intro ➔
        </button>
      </div>

      {/* 3D Arc Reactor Animation Centerpiece */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          zIndex: 2,
        }}
      >
        <Reactor compact={false} />

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            ELECTRA <span style={{ color: "#00f0ff" }}>AI</span>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: stage === "ignited" ? "#00f0ff" : "#00ff88",
              marginTop: 6,
              letterSpacing: "0.05em",
            }}
          >
            {stage === "ignited"
              ? "⚡ POWER SEQUENCE COMPLETE · 1250 kV"
              : `⚡ THUNDER STRIKE IN PROGRESS · ${voltage} kV / 1250 kV`}
          </div>
        </div>

        {/* High Voltage Loading Progress Bar */}
        <div
          style={{
            width: 260,
            height: 6,
            borderRadius: 3,
            background: "rgba(255, 255, 255, 0.15)",
            overflow: "hidden",
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: `${(voltage / 1250) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #7c3aed, #00f0ff, #00ff88)",
              transition: "width 0.1s linear",
            }}
          />
        </div>

        {/* Click anywhere or button to unblock browser sound */}
        <button
          onClick={() => {
            try {
              playLightningThunderSound();
            } catch {
              /* ok */
            }
          }}
          style={{
            marginTop: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "transparent",
            border: "1px dashed rgba(0, 240, 255, 0.4)",
            color: "rgba(255, 255, 255, 0.65)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          🔊 Click to hear thunder roar
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── 4. Full Electric Cursor (Glowing Dot + Rotating Ring + Spark Ripple) ── */
export function ElectricCursor() {
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animId: number;

    const onPointerMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (cursorDot.current) {
        cursorDot.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        cursorDot.current.style.opacity = "1";
      }

      const isInteractive = !!(e.target as HTMLElement)?.closest?.(
        "button, a, input, textarea, select, [role='button'], .prompt-chip, .mode-tab"
      );

      if (cursorRing.current) {
        cursorRing.current.classList.toggle("cursor-hovering", isInteractive);
      }
    };

    const onPointerClick = (e: MouseEvent) => {
      try {
        playElectricClickSound();
      } catch {
        /* ok */
      }

      const ripple = document.createElement("div");
      ripple.className = "cursor-spark-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);

      setTimeout(() => ripple.remove(), 550);
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      if (cursorRing.current) {
        cursorRing.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        cursorRing.current.style.opacity = "1";
      }

      animId = requestAnimationFrame(animateRing);
    };

    animId = requestAnimationFrame(animateRing);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("click", onPointerClick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onPointerClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div className="electric-cursor-dot" ref={cursorDot} aria-hidden="true" />
      <div className="electric-cursor-ring" ref={cursorRing} aria-hidden="true" />
    </>
  );
}
