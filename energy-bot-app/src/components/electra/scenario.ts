import { useState, useEffect } from 'react';
import type { EnergyTelemetry, SmartAppliance } from '../../types/energy';
export function useScenario() {
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


  useEffect(() => {
    const interval=setInterval(()=>setTelemetry(prev=>{
      const solar=Math.max(3.8,Math.min(5.6,prev.solarGenerationKw+(Math.random()-.5)*.12));
      const demand=.6+appliances.filter(a=>a.isActive).reduce((sum,a)=>sum+a.powerWatt,0)/1000;
      return {...prev,solarGenerationKw:solar,homeConsumptionKw:demand,gridExportKw:solar-demand-prev.batteryPowerKw,gridFrequencyHz:50+(Math.random()-.5)*.02,voltageV:230+(Math.random()-.5)*.4};
    }),3500);return()=>clearInterval(interval);
  },[appliances]);
  const toggle=(id:string)=>setAppliances(prev=>prev.map(a=>a.id===id?{...a,isActive:!a.isActive}:a));
  const power=(id:string,watts:number)=>setAppliances(prev=>prev.map(a=>a.id===id?{...a,powerWatt:watts}:a));
  const optimize=()=>setAppliances(prev=>prev.map(a=>a.id==='app-ev'?{...a,isActive:false,isAiOptimized:true,scheduleTime:'Night 02:00 - 06:00 ($0.08/kWh)'}:a.id==='app-hvac'?{...a,powerWatt:1100,isAiOptimized:true}:a.id==='app-water'?{...a,powerWatt:600,isAiOptimized:true}:a));
  const apply=(id:string)=>{
    if(id==='act-peak-shave')setTelemetry(t=>({...t,batteryPowerKw:-3.2,gridExportKw:t.solarGenerationKw-t.homeConsumptionKw+3.2}));
    if(id==='act-delay-ev')setAppliances(prev=>prev.map(a=>a.id==='app-ev'?{...a,isActive:false,isAiOptimized:true,scheduleTime:'Night 02:00 - 06:00 ($0.08/kWh)'}:a));
    if(id==='act-divert-solar')setAppliances(prev=>prev.map(a=>a.id==='app-water'?{...a,isActive:true,powerWatt:1400,isAiOptimized:true}:a));
  };
  return {telemetry,appliances,toggle,power,optimize,apply};
}
