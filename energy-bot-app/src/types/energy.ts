export interface EnergyTelemetry {
  solarGenerationKw: number;
  homeConsumptionKw: number;
  batterySocPct: number;
  batteryPowerKw: number; // positive = charging, negative = discharging
  gridExportKw: number; // positive = export to grid, negative = import from grid
  currentTariffPerKwh: number;
  peakTariffPerKwh: number;
  offPeakTariffPerKwh: number;
  dailyTotalKwh: number;
  carbonOffsetKg: number;
  cleanEnergyPct: number;
  gridFrequencyHz: number;
  voltageV: number;
}

export interface SmartAppliance {
  id: string;
  name: string;
  category: 'ev' | 'hvac' | 'storage' | 'kitchen' | 'computing';
  powerWatt: number;
  defaultWatt: number;
  isActive: boolean;
  isAiOptimized: boolean;
  scheduleTime?: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  metrics?: {
    label: string;
    value: string;
    delta?: string;
  }[];
  actions?: {
    id: string;
    label: string;
    type: 'apply' | 'toggle' | 'simulate';
    done?: boolean;
  }[];
}
