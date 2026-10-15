# ⚡ Electra AI: Electrical Intelligence & Energy Audit Assistant

> An intelligent, real-time microgrid management dashboard and autonomous voice/chat AI copilot that optimizes residential and commercial energy flows (Bifacial Solar generation, Battery Energy Storage Systems (BESS), smart sub-circuit appliance loads, and dynamic Time-of-Use / spot electricity tariffs).

---

## 🌟 Key Features

1. **Electra AI Autonomous AI Copilot (`EnergyBotChat`)**
   - Natural language energy advice engine.
   - Built-in Web Speech API voice recognition (STT) and dynamic speech synthesis (TTS).
   - Dynamic intent resolution for solar diversion, dynamic tariffs, EV charge windows, and microgrid islanding.
   - One-click actionable triggers that directly control simulated hardware states.

2. **Continuous Real-Time Telemetry Stream (`LiveTelemetryGrid`)**
   - Live simulated microgrid flux (Solar, Grid Frequency, True RMS Voltage, Net Grid Import/Export).
   - Dynamic battery State of Charge (SoC) radial visualization.

3. **Sub-circuit Device Automation Matrix (`SmartApplianceMatrix`)**
   - Real-time power control and toggles for high-draw household loads:
     - Tesla Wallbox EV Charger
     - Smart Inverter Heat Pump
     - Hybrid Heat Pump Water Heater
     - Home AI & Network Server
     - Induction Cooking Range
   - Instant "AI Optimize All" automated peak shaving and off-peak scheduling.

4. **Interactive 3D Energy Core (`EnergyCoreCanvas`)**
   - Three.js WebGL visualization featuring dual orbital rings, additive-blended particle clouds, and glowing core geomtry.

5. **Ecological Impact & Carbon Ledger (`CarbonSavingsTracker`)**
   - Real-time tracking of direct fossil offset (kg CO₂), annual run-rate, forest sequestration equivalent, and displaced vehicle mileage.

---

## 📁 Repository Structure

```
Energy bot/
├── energy-bot-app/          # Core React 19 + TypeScript + Vite + Tailwind CSS application
│   ├── src/
│   │   ├── components/      # 3D Core, Voice Waveform, Telemetry Grid, Device Matrix, Chatbot
│   │   ├── types/           # Energy telemetry, appliance, and message type interfaces
│   │   └── App.tsx          # Main microgrid state engine and layout orchestration
│   ├── package.json
│   └── vite.config.ts
├── animated-website/        # Initial UI experimentation & animated template components
└── .gitignore
```

---

## 🚀 Quickstart Guide

### 1. Navigate to the main app
```bash
cd energy-bot-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.


## Report Q&A and multilingual electrical assistance

The chat now has **Audit report**, **Electrical Q&A**, and **Microgrid demo** modes. A separate Node API in `server/` reads the configured private Supabase audit PDF, retrieves page text, and uses Groq to answer in the selected language. Source quotations are checked against retrieved pages and shown as expandable citations. The dashboard remains a simulation.

See [Connect the report backend](docs/REPORT_CHAT.md) for exact Render settings, server-only secrets, access boundaries, tests, and extraction limitations. The static frontend alone cannot answer report questions; set `VITE_API_BASE_URL` after deploying the backend. Do not put Supabase server keys or Groq keys in the frontend.

```bash
npm --prefix server ci
npm --prefix server test
npm --prefix energy-bot-app ci
npm --prefix energy-bot-app run build
```

PDF OCR, arbitrary report uploads, per-user authentication, persistent chat history, and hardware control are not implemented. Language-model and live Supabase checks require deployment credentials; local tests use controlled provider responses and the uploaded PDF.
