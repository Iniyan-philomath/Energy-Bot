import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leaf, TrendingUp, Globe, Award } from "lucide-react";
import { AppleTiltCard } from "./AppleTiltCard";
import type { EnergyTelemetry } from "../types/energy";

gsap.registerPlugin(ScrollTrigger);

interface Props { 
  telemetry: EnergyTelemetry; 
}

export const CarbonSavingsTracker: React.FC<Props> = ({ telemetry }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".carbon-stat", { 
        opacity: 0, 
        y: 40, 
        stagger: 0.1, 
        duration: 0.8, 
        ease: "power3.out",
        scrollTrigger: { 
          trigger: ref.current, 
          start: "top 85%" 
        } 
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  const annualKg = +(telemetry.carbonOffsetKg * 365).toFixed(0);
  const treeEquiv = Math.round(annualKg / 21);
  const mileEquiv = Math.round(annualKg * 2.5);

  const milestones = [
    { 
      icon: <Leaf className="w-5 h-5 text-emerald-400" />, 
      label: "Carbon Avoidance Today", 
      val: `${telemetry.carbonOffsetKg.toFixed(1)} kg`, 
      sub: "Direct fossil offset", 
    },
    { 
      icon: <TrendingUp className="w-5 h-5 text-amber-400" />, 
      label: "Annual Run-Rate", 
      val: `${(annualKg / 1000).toFixed(1)} t CO₂`, 
      sub: "At current clean generation", 
    },
    { 
      icon: <Globe className="w-5 h-5 text-teal-400" />, 
      label: "Forest Equivalent", 
      val: `${treeEquiv} trees`, 
      sub: "Carbon sequestered 1 yr", 
    },
    { 
      icon: <Award className="w-5 h-5 text-indigo-400" />, 
      label: "Displaced Miles", 
      val: `${mileEquiv.toLocaleString()} mi`, 
      sub: "Combustion car offset", 
    },
  ];

  return (
    <section ref={ref} className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />

      <div className="text-center mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          <span>Environmental Ledger</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-titanium">
          Ecological Impact.
        </h2>
        <p className="text-neutral-400 text-base sm:text-lg max-w-lg mx-auto">
          Every kilowatt-hour orchestrated by VOLT-IQ eliminates fossil peaking plant generation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {milestones.map((m, i) => (
          <AppleTiltCard key={i} className="carbon-stat p-7 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              {m.icon}
            </div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-mono font-medium">{m.label}</p>
            <p className="text-3xl font-extrabold text-white font-mono">{m.val}</p>
            <p className="text-xs text-neutral-500 font-mono">{m.sub}</p>
          </AppleTiltCard>
        ))}
      </div>

      {/* Apple Pro Wide Status Banner */}
      <AppleTiltCard className="mt-10 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-400 font-mono mb-2">Clean Energy Factor</p>
          <p className="text-6xl font-black text-emerald-400 font-mono">
            {telemetry.cleanEnergyPct}<span className="text-3xl text-neutral-500 font-sans">%</span>
          </p>
          <p className="text-neutral-400 mt-2 text-sm font-normal">Active microgrid self-sufficiency rating</p>
        </div>

        <div className="flex flex-col gap-4 min-w-[260px] w-full sm:w-auto">
          {[
            { label: "Solar Direct", pct: telemetry.cleanEnergyPct, color: "from-amber-400 to-amber-500" },
            { label: "BESS Storage", pct: Math.round(telemetry.batterySocPct * 0.7), color: "from-emerald-400 to-teal-400" },
            { label: "Grid Renewable", pct: 14, color: "from-neutral-400 to-neutral-200" },
          ].map((b, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1.5">
                <span>{b.label}</span>
                <span className="text-white font-semibold">{b.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden p-[1px]">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${b.color} transition-all duration-1000`} 
                  style={{ width: `${b.pct}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </AppleTiltCard>
    </section>
  );
};
