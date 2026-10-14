import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, Zap, Wind, DollarSign, Leaf, Gauge } from "lucide-react";
import { AppleTiltCard } from "./AppleTiltCard";
import type { EnergyTelemetry } from "../types/energy";

gsap.registerPlugin(ScrollTrigger);

interface Props { 
  telemetry: EnergyTelemetry; 
}

export const LiveTelemetryGrid: React.FC<Props> = ({ telemetry }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".tele-card", {
        opacity: 0,
        y: 40,
        stagger: 0.08,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { 
          trigger: sectionRef.current, 
          start: "top 85%" 
        }
      });
      gsap.from(".tele-title", {
        opacity: 0,
        y: 25,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { 
          trigger: sectionRef.current, 
          start: "top 90%" 
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const battPct = Math.min(100, Math.max(0, telemetry.batterySocPct)) / 100;

  const stats = [
    { 
      icon: <Zap className="w-5 h-5 text-amber-400" />, 
      label: "Solar Generation", 
      val: `+${telemetry.solarGenerationKw.toFixed(2)} kW`, 
      sub: "Bifacial Array · 840 W/m²", 
      color: "text-amber-400" 
    },
    { 
      icon: <Activity className="w-5 h-5 text-emerald-400" />, 
      label: "Grid Frequency", 
      val: `${telemetry.gridFrequencyHz.toFixed(3)} Hz`, 
      sub: "Nominal 50.000 Hz · Sync < 2ms", 
      color: "text-emerald-400" 
    },
    { 
      icon: <Wind className="w-5 h-5 text-neutral-300" />, 
      label: "Grid Voltage", 
      val: `${telemetry.voltageV.toFixed(1)} V`, 
      sub: "Phase A True RMS Voltage", 
      color: "text-white" 
    },
    { 
      icon: <Gauge className="w-5 h-5 text-neutral-200" />, 
      label: "Home Consumption", 
      val: `${telemetry.homeConsumptionKw.toFixed(2)} kW`, 
      sub: "7 Active IoT Subcircuits", 
      color: "text-white" 
    },
    { 
      icon: <DollarSign className="w-5 h-5 text-emerald-300" />, 
      label: "Dynamic Tariff", 
      val: `$${telemetry.currentTariffPerKwh.toFixed(3)}/kWh`, 
      sub: `Peak: $${telemetry.peakTariffPerKwh} · Off-peak: $${telemetry.offPeakTariffPerKwh}`, 
      color: "text-emerald-300" 
    },
    { 
      icon: <Leaf className="w-5 h-5 text-emerald-400" />, 
      label: "Carbon Avoidance", 
      val: `${telemetry.carbonOffsetKg.toFixed(1)} kg`, 
      sub: "Equivalent to 1.8 trees planted", 
      color: "text-emerald-400" 
    },
  ];

  return (
    <section ref={sectionRef} className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="tele-title text-center mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
          <span>Continuous Microgrid Stream</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-titanium">
          Precision Telemetry.
        </h2>
        <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">
          Synchronized sub-second energy metrics direct from smart bi-directional inverters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Battery Circular Gauge Bento Card */}
        <AppleTiltCard className="tele-card p-8 flex flex-col items-center justify-center md:row-span-2 gap-6 text-center">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-mono font-medium">BESS Storage State</p>
          
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="none" 
                stroke="rgba(255,255,255,0.06)" 
                strokeWidth="7" 
              />
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="none" 
                stroke="url(#battGradient)" 
                strokeWidth="7"
                strokeLinecap="round" 
                strokeDasharray={circ} 
                strokeDashoffset={circ * (1 - battPct)}
                className="transition-all duration-1000 ease-out" 
              />
              <defs>
                <linearGradient id="battGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {telemetry.batterySocPct}%
              </span>
              <span className="text-[11px] text-neutral-400 font-mono mt-0.5">Capacity</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-emerald-400 font-mono font-semibold">
              +{Math.abs(telemetry.batteryPowerKw).toFixed(1)} kW Fast Charging
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              Daily Accumulated: {telemetry.dailyTotalKwh.toFixed(1)} kWh
            </p>
          </div>
        </AppleTiltCard>

        {/* Clean Energy Share Wide Card */}
        <AppleTiltCard className="tele-card p-8 col-span-1 md:col-span-2 flex flex-col justify-between min-h-[170px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-400 font-mono mb-1.5 font-medium">Clean Energy Autonomy</p>
              <p className="text-5xl font-black text-white font-mono tracking-tight">
                {telemetry.cleanEnergyPct}<span className="text-2xl text-neutral-500">%</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Leaf className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono">
              <span className="text-emerald-400">100% Renewable Mix</span>
              <span>Grid Dependence: {(100 - telemetry.cleanEnergyPct).toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden p-[1px]">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-1000 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                style={{ width: `${telemetry.cleanEnergyPct}%` }} 
              />
            </div>
          </div>
        </AppleTiltCard>

        {/* 6 Sub-telemetry Cards */}
        {stats.map((s, i) => (
          <AppleTiltCard key={i} className="tele-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">{s.label}</p>
              <p className={`text-xl font-bold font-mono mt-0.5 ${s.color}`}>{s.val}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">{s.sub}</p>
            </div>
          </AppleTiltCard>
        ))}
      </div>
    </section>
  );
};
