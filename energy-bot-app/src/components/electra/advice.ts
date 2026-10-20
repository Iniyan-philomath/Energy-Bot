import type { ChatMessage, EnergyTelemetry } from '../../types/energy';
// Preserve the original local intent routing and action IDs. No remote API exists.
export function generateEnergyAdvice(query: string, t: EnergyTelemetry): ChatMessage {
  const q=query.toLowerCase();
  const base={id:crypto.randomUUID(),sender:'bot' as const,timestamp:'Scenario response'};
  if (/tariff|peak|price|cost/.test(q)) return {...base,
    text:`Dynamic Tariff Prediction:\nThe scenario’s peak rate is $${t.peakTariffPerKwh.toFixed(2)}/kWh, compared with $${t.currentTariffPerKwh.toFixed(2)}/kWh now. With the battery at ${t.batterySocPct}%, you can simulate a 3.2 kW discharge during the peak window. Actual savings require a verified usage profile.`,
    metrics:[{label:'Current tariff',value:`$${t.currentTariffPerKwh.toFixed(2)}/kWh`},{label:'Peak tariff',value:`$${t.peakTariffPerKwh.toFixed(2)}/kWh`}],actions:[{id:'act-peak-shave',label:'Activate Peak Shaving Discharge',type:'apply'}]};
  if (/ev|car|tesla|charge/.test(q)) return {...base,
    text:`EV Charging Window:\nThe demo Wallbox has a 7.2 kW maximum load. Schedule it for the scenario’s overnight window, 02:00–06:00, at $${t.offPeakTariffPerKwh.toFixed(2)}/kWh. Vehicle charge state and departure readiness are not connected.`,
    metrics:[{label:'Off-peak tariff',value:`$${t.offPeakTariffPerKwh.toFixed(2)}/kWh`}],actions:[{id:'act-delay-ev',label:'Schedule Nighttime EV Charge',type:'apply'}]};
  if (/solar|panel|weather|sun/.test(q)) return {...base,
    text:`Solar Microgrid Balance:\nSimulated generation is ${t.solarGenerationKw.toFixed(1)} kW, with home demand of ${t.homeConsumptionKw.toFixed(1)} kW and net grid exchange of ${t.gridExportKw.toFixed(1)} kW (positive means export). You can model diverting solar to the heat pump water heater at 1.4 kW.`,
    metrics:[{label:'Solar generation',value:`${t.solarGenerationKw.toFixed(1)} kW`},{label:'Grid exchange',value:`${t.gridExportKw.toFixed(1)} kW`}],actions:[{id:'act-divert-solar',label:'Divert Surplus to Thermal Storage',type:'apply'}]};
  if (/battery|bess|backup|outage|island/.test(q)) return {...base,
    text:`Battery & Resilience:\nThe simulated battery is at ${t.batterySocPct}% state of charge. Backup duration and safe islanding require a verified capacity, inverter capability, and critical-load profile. These are not connected; this interface cannot isolate real equipment.`,metrics:[{label:'State of charge',value:`${t.batterySocPct}%`},{label:'Home demand',value:`${t.homeConsumptionKw.toFixed(1)} kW`}]};
  return {...base,text:`Scenario Overview:\nHome demand is ${t.homeConsumptionKw.toFixed(1)} kW, solar generation is ${t.solarGenerationKw.toFixed(1)} kW, and the battery is at ${t.batterySocPct}%. Ask about tariffs, solar, EV charging, or battery state.\nThis local assistant does not have an uploaded audit, power-factor measurements, or a forecasting service.`,metrics:[{label:'Source',value:'Local simulation'},{label:'Grid state',value:t.gridExportKw>=0?'Net export':'Net import'}]};
}
