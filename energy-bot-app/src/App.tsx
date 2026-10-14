import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Lenis from 'lenis';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EnergyBotChat } from './components/EnergyBotChat';
import { LiveTelemetryGrid } from './components/LiveTelemetryGrid';
import { SmartApplianceMatrix } from './components/SmartApplianceMatrix';
import { CarbonSavingsTracker } from './components/CarbonSavingsTracker';
import { Footer } from './components/Footer';
import type { EnergyTelemetry, SmartAppliance } from './types/energy';

export default function App() {
  const [telemetry, setTelemetry] = useState<EnergyTelemetry>({
    solarGenerationKw: 4.8,
    homeConsumptionKw: 2.1,
    batterySocPct: 88,
    batteryPowerKw: 1.9, // positive = charging
    gridExportKw: 0.8, // positive = net export
    currentTariffPerKwh: 0.12,
    peakTariffPerKwh: 0.36,
    offPeakTariffPerKwh: 0.08,
    dailyTotalKwh: 18.4,
    carbonOffsetKg: 14.2,
    cleanEnergyPct: 84,
    gridFrequencyHz: 50.002,
    voltageV: 230.2
  });

  const [appliances, setAppliances] = useState<SmartAppliance[]>([
    {
      id: 'app-ev',
      name: 'Tesla Wallbox EV Charger',
      category: 'ev',
      powerWatt: 3200,
      defaultWatt: 7200,
      isActive: false,
      isAiOptimized: true,
      scheduleTime: 'Night 02:00 - 06:00 ($0.08/kWh)',
      icon: 'car'
    },
    {
      id: 'app-hvac',
      name: 'Smart Inverter Heat Pump',
      category: 'hvac',
      powerWatt: 1400,
      defaultWatt: 2400,
      isActive: true,
      isAiOptimized: true,
      scheduleTime: 'Eco climate mode active',
      icon: 'flame'
    },
    {
      id: 'app-water',
      name: 'Hybrid Heat Pump Water Heater',
      category: 'storage',
      powerWatt: 850,
      defaultWatt: 1800,
      isActive: true,
      isAiOptimized: false,
      scheduleTime: 'Peak Solar Window 12:00',
      icon: 'droplets'
    },
    {
      id: 'app-server',
      name: 'Home AI & Network Server',
      category: 'computing',
      powerWatt: 450,
      defaultWatt: 650,
      isActive: true,
      isAiOptimized: false,
      icon: 'server'
    },
    {
      id: 'app-kitchen',
      name: 'Induction Cooking Range',
      category: 'kitchen',
      powerWatt: 1200,
      defaultWatt: 2200,
      isActive: false,
      isAiOptimized: false,
      icon: 'cooking-pot'
    }
  ]);

  const chatSectionRef = useRef<HTMLDivElement>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let animationId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationId = requestAnimationFrame(raf);
    }

    animationId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationId);
      lenis.destroy();
    };
  }, []);

  // Subtle natural microgrid telemetry variance
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const solarFluct = (Math.random() - 0.5) * 0.12;
        const newSolar = Math.max(3.8, Math.min(5.6, prev.solarGenerationKw + solarFluct));
        
        const activeAppWatts = appliances
          .filter(a => a.isActive)
          .reduce((sum, a) => sum + a.powerWatt, 0);
        const baseHomeKw = 0.6;
        const newHomeKw = Math.round((baseHomeKw + activeAppWatts / 1000) * 10) / 10;

        const newNetExport = Math.round((newSolar - newHomeKw - 1.2) * 10) / 10;
        const newFreq = 50.0 + (Math.random() - 0.5) * 0.02;
        const newVolt = 230.0 + (Math.random() - 0.5) * 0.4;

        return {
          ...prev,
          solarGenerationKw: newSolar,
          homeConsumptionKw: newHomeKw,
          gridExportKw: newNetExport,
          gridFrequencyHz: newFreq,
          voltageV: newVolt,
          carbonOffsetKg: prev.carbonOffsetKg + 0.01
        };
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [appliances]);

  const handleToggleAppliance = (id: string) => {
    setAppliances(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, isActive: !a.isActive };
      }
      return a;
    }));
  };

  const handleUpdateAppliancePower = (id: string, watts: number) => {
    setAppliances(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, powerWatt: watts };
      }
      return a;
    }));
  };

  const handleOptimizeAll = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#34d399', '#fbbf24', '#ffffff']
    });

    setAppliances(prev => prev.map(a => {
      if (a.id === 'app-ev') {
        return { ...a, isActive: false, isAiOptimized: true, scheduleTime: 'Night 02:00 - 06:00 ($0.08/kWh)' };
      }
      if (a.id === 'app-hvac') {
        return { ...a, powerWatt: 1100, isAiOptimized: true };
      }
      if (a.id === 'app-water') {
        return { ...a, powerWatt: 600, isAiOptimized: true };
      }
      return a;
    }));
  };

  const handleApplyOptimization = (actionId: string) => {
    if (actionId === 'act-peak-shave') {
      setTelemetry(prev => ({
        ...prev,
        batteryPowerKw: -3.2,
        gridExportKw: 2.1,
        cleanEnergyPct: 96
      }));
    } else if (actionId === 'act-delay-ev') {
      setAppliances(prev => prev.map(a => a.id === 'app-ev' ? { ...a, isActive: false, isAiOptimized: true } : a));
    } else if (actionId === 'act-divert-solar') {
      setAppliances(prev => prev.map(a => a.id === 'app-water' ? { ...a, isActive: true, powerWatt: 1400, isAiOptimized: true } : a));
    }
  };

  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen apple-bg-mesh text-neutral-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 antialiased">
      <Navbar 
        telemetry={telemetry}
        onOpenVoiceCopilot={scrollToChat}
        onQuickSimulate={handleOptimizeAll}
      />

      <main className="flex-1">
        <Hero 
          telemetry={telemetry}
          onExploreBot={scrollToChat}
          onOptimizeGrid={handleOptimizeAll}
        />

        <EnergyBotChat 
          telemetry={telemetry}
          onApplyOptimization={handleApplyOptimization}
          chatSectionRef={chatSectionRef}
        />

        <LiveTelemetryGrid 
          telemetry={telemetry}
        />

        <SmartApplianceMatrix 
          appliances={appliances}
          onToggleAppliance={handleToggleAppliance}
          onUpdateAppliancePower={handleUpdateAppliancePower}
          onOptimizeAll={handleOptimizeAll}
        />

        <CarbonSavingsTracker 
          telemetry={telemetry}
        />
      </main>

      <Footer />
    </div>
  );
}
