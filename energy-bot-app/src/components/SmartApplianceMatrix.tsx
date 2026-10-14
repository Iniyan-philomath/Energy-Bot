import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Flame, Droplets, Server, CookingPot, Sparkles, ToggleLeft, ToggleRight, Sliders } from "lucide-react";
import { AppleTiltCard } from "./AppleTiltCard";
import type { SmartAppliance } from "../types/energy";

gsap.registerPlugin(ScrollTrigger);

const ICON_MAP: Record<string, React.ReactNode> = {
  car: <Car className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  droplets: <Droplets className="w-5 h-5" />,
  server: <Server className="w-5 h-5" />,
  "cooking-pot": <CookingPot className="w-5 h-5" />,
};

interface Props { 
  appliances: SmartAppliance[]; 
  onToggleAppliance: (id: string) => void; 
  onUpdateAppliancePower: (id: string, w: number) => void; 
  onOptimizeAll: () => void; 
}

export const SmartApplianceMatrix: React.FC<Props> = ({ 
  appliances, 
  onToggleAppliance, 
  onUpdateAppliancePower, 
  onOptimizeAll 
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".app-card", { 
        opacity: 0, 
        y: 40, 
        stagger: 0.08, 
        duration: 0.75, 
        ease: "power3.out",
        scrollTrigger: { 
          trigger: ref.current, 
          start: "top 85%" 
        } 
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  const totalActive = appliances.filter(a => a.isActive).reduce((s, a) => s + a.powerWatt, 0);

  return (
    <section ref={ref} className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-14">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400 mb-3">
            <span>Sub-circuit Automation</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-titanium">
            Device Control Matrix.
          </h2>
          <p className="text-neutral-400 mt-2 text-base">
            Active load draw: <span className="text-emerald-400 font-mono font-bold">{(totalActive / 1000).toFixed(2)} kW</span>
          </p>
        </div>

        <button 
          onClick={onOptimizeAll} 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-all cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>AI Optimize All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {appliances.map((ap) => {
          const pct = Math.round((ap.powerWatt / ap.defaultWatt) * 100);
          return (
            <AppleTiltCard key={ap.id} className={`app-card p-6 flex flex-col justify-between gap-5 ${ap.isActive ? 'border-emerald-500/20' : ''}`}>
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      ap.isActive 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]" 
                        : "bg-white/[0.04] text-neutral-500 border border-white/[0.05]"
                    }`}>
                      {ICON_MAP[ap.icon] ?? <Sliders className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{ap.name}</p>
                      {ap.isAiOptimized && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                          <Sparkles className="w-2.5 h-2.5" /> Autonomous Mode
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onToggleAppliance(ap.id)} 
                    className="shrink-0 transition-transform active:scale-90 cursor-pointer"
                  >
                    <AnimatePresence mode="wait">
                      {ap.isActive ? (
                        <motion.div key="on" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                          <ToggleRight className="w-9 h-9 text-emerald-400" />
                        </motion.div>
                      ) : (
                        <motion.div key="off" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                          <ToggleLeft className="w-9 h-9 text-neutral-600" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>

                {/* Power Slider */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-mono text-neutral-400 mb-2">
                    <span>Power Throttle</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {ap.powerWatt} W <span className="text-neutral-500 font-normal">/ {ap.defaultWatt} W max</span>
                    </span>
                  </div>

                  <input 
                    type="range" 
                    min={50} 
                    max={ap.defaultWatt} 
                    value={ap.powerWatt}
                    onChange={e => onUpdateAppliancePower(ap.id, Number(e.target.value))}
                    disabled={!ap.isActive}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-30 accent-emerald-400"
                    style={{ 
                      background: `linear-gradient(to right, #34d399 ${pct}%, rgba(255,255,255,0.08) ${pct}%)` 
                    }}
                  />
                </div>
              </div>

              {ap.scheduleTime && (
                <div className="text-[11px] text-neutral-400 font-mono bg-white/[0.02] rounded-xl py-2 px-3 border border-white/[0.05]">
                  ⏱ {ap.scheduleTime}
                </div>
              )}
            </AppleTiltCard>
          );
        })}
      </div>
    </section>
  );
};
