import { useState, useEffect } from "react";
import { Zap, Sparkles, Cpu } from "lucide-react";
import type { EnergyTelemetry } from "../types/energy";

interface NavbarProps {
  telemetry: EnergyTelemetry;
  onOpenVoiceCopilot: () => void;
  onQuickSimulate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  telemetry, 
  onOpenVoiceCopilot,
  onQuickSimulate 
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 transition-all duration-300">
      <div 
        className={`w-full max-w-6xl flex items-center justify-between px-5 py-3 rounded-full transition-all duration-500 ${
          scrolled 
            ? "apple-glass-pill shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-white/[0.15]" 
            : "bg-neutral-950/40 backdrop-blur-md border border-white/[0.08]"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 p-[1px] flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              VOLT-IQ
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PRO</span>
            </span>
            <span className="text-[10px] text-neutral-400 tracking-wider uppercase font-medium">Autonomous Grid</span>
          </div>
        </div>

        {/* Dynamic Telemetry Status Island */}
        <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-400">Microgrid:</span>
            <span className="text-emerald-400 font-semibold">{telemetry.cleanEnergyPct}% Clean</span>
          </div>

          <span className="text-white/10">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Solar:</span>
            <span className="text-amber-400 font-medium">+{telemetry.solarGenerationKw.toFixed(1)} kW</span>
          </div>

          <span className="text-white/10">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Battery:</span>
            <span className="text-emerald-300 font-medium">{telemetry.batterySocPct}%</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onQuickSimulate}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Balance</span>
          </button>

          <button
            onClick={onOpenVoiceCopilot}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Energy Bot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
