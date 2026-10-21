import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
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
    if (disp < 7) {
      segments.push({ x1: ax, y1: ay, x2: bx, y2: by });
      return;
    }

    const midX = (ax + bx) / 2 + (Math.random() - 0.5) * disp;
    const midY = (ay + by) / 2 + (Math.random() - 0.5) * disp;

    drawSegment(ax, ay, midX, midY, disp / 2);
    drawSegment(midX, midY, bx, by, disp / 2);

    if (Math.random() < branchProbability) {
      const branchAngle = (Math.random() - 0.5) * 0.9;
      const len = Math.hypot(bx - ax, by - ay) * 0.45;
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
      const startX = Math.random() * width;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * (width * 0.35);
      const endY = height * (0.45 + Math.random() * 0.55);

      const segments = createBolt(startX, startY, endX, endY, 120, 0.4);
      bolts.push({
        segments,
        alpha: 1.0,
        width: Math.random() * 2.5 + 2,
        color: Math.random() > 0.4 ? "#38bdf8" : "#a855f7",
      });
    };

    // Spawn 2-3 instant initial bolts
    spawnBolt();
    setTimeout(spawnBolt, 140);
    setTimeout(spawnBolt, 280);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        ctx.save();
        ctx.strokeStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = b.width;
        ctx.globalAlpha = Math.max(0, b.alpha);

        ctx.beginPath();
        for (const seg of b.segments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();

        // White core highlight
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1, b.width * 0.4);
        ctx.shadowBlur = 6;
        ctx.stroke();

        ctx.restore();

        b.alpha -= 0.055;
        if (b.alpha <= 0) {
          bolts.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
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

/* ─── 2. Fast Thunder Strike Entrance (500–900ms Entrance) ───────────────── */
export function PowerIntro({ onFinish }: { onFinish: () => void }) {
  const reduced = useReducedMotion();
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (reduced) {
      onFinish();
      return;
    }

    try {
      playReactorPowerUpSound();
    } catch {
      // Audio autoplay policy fallback
    }

    // Trigger thunder flash & strike at 220ms
    const tFlash = setTimeout(() => {
      setFlashing(true);
      try {
        playLightningThunderSound();
      } catch {
        // Fallback
      }
      setTimeout(() => setFlashing(false), 240);
    }, 220);

    // End intro cleanly at 850ms, revealing the full chat workspace
    const tEnd = setTimeout(() => {
      onFinish();
    }, 850);

    return () => {
      clearTimeout(tFlash);
      clearTimeout(tEnd);
    };
  }, [onFinish, reduced]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#080c18",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <LightningStormCanvas active={true} />

      {/* Screen flash strobe */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(168, 85, 247, 0.25) 50%, transparent 80%)",
          opacity: flashing ? 1 : 0,
          transition: "opacity 0.08s ease",
          pointerEvents: "none",
        }}
      />

      {/* Central Energizing Badge */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.15, 1], opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 50px rgba(59, 130, 246, 0.6), 0 0 20px rgba(124, 58, 237, 0.8)",
          }}
        >
          <Zap size={44} color="#ffffff" fill="#ffffff" />
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#ffffff",
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
            }}
          >
            ELECTRA <span style={{ color: "#38bdf8" }}>AI</span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.65)",
              marginTop: 4,
              letterSpacing: "0.04em",
            }}
          >
            ⚡ SYNCHRONIZING ENERGY WORKSPACE…
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── 3. Electric Spark Ripple on Click ─────────────────────────────────── */
export function ElectricCursor() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      try {
        playElectricClickSound();
      } catch {
        // Fallback
      }

      const ripple = document.createElement("div");
      ripple.className = "cursor-spark-ripple";
      ripple.style.position = "fixed";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = "22px";
      ripple.style.height = "22px";
      ripple.style.marginLeft = "-11px";
      ripple.style.marginTop = "-11px";
      ripple.style.borderRadius = "50%";
      ripple.style.pointerEvents = "none";
      ripple.style.border = "2px solid #38bdf8";
      ripple.style.boxShadow = "0 0 12px #38bdf8, 0 0 24px #a855f7";
      ripple.style.zIndex = "99999";
      ripple.style.animation = "spark-expand 0.45s ease-out forwards";
      document.body.appendChild(ripple);

      setTimeout(() => ripple.remove(), 480);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return null;
}

export function Reactor() {
  return null;
}
