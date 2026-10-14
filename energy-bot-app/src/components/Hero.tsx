import React from 'react';
import { ArrowRight, Sparkles, Activity, ShieldCheck, Sun, BatteryCharging, Home, Zap } from 'lucide-react';
import { EnergyCoreCanvas } from './EnergyCoreCanvas';
import { AppleTiltCard } from './AppleTiltCard';
import type { EnergyTelemetry } from '../types/energy';

interface HeroProps {
  telemetry: EnergyTelemetry;
  onExploreBot: () => void;
  onOptimizeGrid: () => void;
}

export const Hero: React.FC<HeroProps> = ({ telemetry, onExploreBot, onOptimizeGrid }) => {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Subtle Apple ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Titanium Pill Badge */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-medium text-neutral-300 shadow-[0_0_20px_rgba(255,255,255,0.03)] backdrop-blur-xl">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Next-Generation Autonomous Microgrid OS</span>
          <span className="w-1 h-1 rounded-full bg-neutral-600 mx-1" />
          <span className="text-emerald-400 font-mono">v4.2 Active</span>
        </div>
      </div>

      {/* Main Copy & 3D Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Apple Typography */}
        <div className="lg:col-span-7 text-center lg:text-left space-y-6">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.98] text-titanium">
            Energy.<br />
            <span className="text-emerald-glow">Orchestrated.</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
            Electra AI transforms residential solar, battery storage, and dynamic tariffs into a self-balancing clean energy engine with predictive agentic intelligence.
          </p>

          {/* Interactive CTAs */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={onExploreBot}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold text-black bg-white hover:bg-neutral-100 transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
            >
              <Activity className="w-4 h-4 text-black" />
              <span>Engage Energy Copilot</span>
              <ArrowRight className="w-4 h-4 text-black/60" />
            </button>

            <button
              onClick={onOptimizeGrid}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-neutral-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] transition-all cursor-pointer backdrop-blur-lg"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulate Peak Shaving</span>
            </button>
          </div>

          {/* Compliance & Hardware Support */}
          <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-neutral-500 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>IEEE 2030.5 Protocol</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>OpenADR 2.0b Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-sans">99.98% Telemetry Uptime</span>
            </div>
          </div>
        </div>

        {/* Right Column: Three.js Interactive 3D Energy Core */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[460px] flex items-center justify-center">
            {/* Ambient light ring behind core */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/10 to-amber-500/10 blur-[80px] pointer-events-none" />

            {/* Three.js Canvas */}
            <EnergyCoreCanvas className="w-full h-full" intensity={1.1} />

            {/* Floating Glass HUD Pills around 3D core */}
            <div className="absolute -bottom-2 -left-2 px-4 py-2 rounded-2xl apple-glass-pill text-xs font-mono flex items-center gap-2 text-neutral-300 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Grid Synced: <strong className="text-white">{telemetry.gridFrequencyHz.toFixed(2)} Hz</strong></span>
            </div>

            <div className="absolute -top-2 -right-2 px-4 py-2 rounded-2xl apple-glass-pill text-xs font-mono flex items-center gap-2 text-neutral-300 pointer-events-auto">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Solar: <strong className="text-amber-300">{telemetry.solarGenerationKw.toFixed(1)} kW</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Apple Bento Grid: Microgrid Telemetry Cards */}
      <div className="mt-20">
        <div className="text-center mb-8">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Real-Time Microgrid Architecture</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Solar Photovoltaics */}
          <AppleTiltCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Rooftop Solar</span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Sun className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              +{telemetry.solarGenerationKw.toFixed(1)} <span className="text-sm font-normal text-neutral-400">kW</span>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
              <span>Irradiance</span>
              <span className="font-mono text-amber-400 font-medium">840 W/m²</span>
            </div>
          </AppleTiltCard>

          {/* Card 2: Home Demand */}
          <AppleTiltCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Active Load</span>
              <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-200 border border-white/[0.1]">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {telemetry.homeConsumptionKw.toFixed(1)} <span className="text-sm font-normal text-neutral-400">kW</span>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
              <span>Power Factor</span>
              <span className="font-mono text-emerald-400 font-medium">0.98</span>
            </div>
          </AppleTiltCard>

          {/* Card 3: BESS Storage */}
          <AppleTiltCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">BESS Battery</span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <BatteryCharging className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {telemetry.batterySocPct}% <span className="text-sm font-normal text-neutral-400">SoC</span>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
              <span>Status</span>
              <span className="font-mono text-emerald-400 font-medium">+{Math.abs(telemetry.batteryPowerKw).toFixed(1)} kW Charge</span>
            </div>
          </AppleTiltCard>

          {/* Card 4: Grid Balance */}
          <AppleTiltCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Smart Grid</span>
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {telemetry.gridExportKw > 0 ? `+${telemetry.gridExportKw.toFixed(1)}` : telemetry.gridExportKw.toFixed(1)} <span className="text-sm font-normal text-neutral-400">kW</span>
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
              <span>Dynamic Tariff</span>
              <span className="font-mono text-emerald-300 font-medium">${telemetry.currentTariffPerKwh}/kWh</span>
            </div>
          </AppleTiltCard>
        </div>
      </div>
    </section>
  );
};
