# Electra — The Power Observatory

The main application is `energy-bot-app`. Run `npm ci`, then `npm run dev` here. `npm run build` runs TypeScript and the production bundle; `npm run lint` runs Oxlint.

## Frontend architecture

- `src/components/electra/scenario.ts` retains the existing simulated device state and controls. Grid exchange is derived from generation, device demand, and battery power. No backend, authentication, report ingestion, or external AI API exists in this checkout.
- `advice.ts` preserves the local intent routing and supported action IDs. Unverified savings, forecasts, and islanding claims have been replaced with explicit data limitations. No fake response streaming is used.
- `PowerAssembly.tsx` is a lazy-loaded procedural R3F scene: ceramic insulator, copper winding, metal support cage, engraved base, and busbars. Pointer, scroll, processing, and completion movements are interface cues, not measurements.
- `experience.ts` owns a GSAP intro state machine: anticipation → strike → energizing → reveal → ready. Playback lasts 3.8 seconds once the scene initializes. Slow initialization has a five-second escape; skip, hidden-tab, reduced-motion, and WebGL-error paths reveal the dashboard. Completion persists per tab session. Settings allow replay.
- `SceneStage.tsx` owns the scene's intro-to-dashboard framing and WebGL fallback. Rendering pauses offscreen and while hidden. Mobile uses DPR 1; desktop is capped at 1.5. No postprocessing or external model assets are loaded.
- GSAP owns intro timing, scene framing, and scroll choreography. Motion owns message entrances, the settings panel, and navigation-marker layout. They do not animate the same element properties.
- `index.css` defines porcelain/graphite design tokens, responsive layouts, native-scroll behavior, focus states, and reduced-motion overrides. `index.html` applies saved/system theme before React paints.

Sound is synthesized locally using filtered Web Audio noise. Thunder is scheduled only on a running AudioContext; a blocked context is closed without scheduling delayed playback. Replay from settings can unlock audio. Mute is persistent. Spoken chat responses are opt-in and also obey global mute. No continuous audio or button sounds are used.

## Dependencies and assets

No new dependencies or paid assets were added. Installed licenses: Three.js, R3F, Drei, and Motion (MIT); Lucide (ISC); Geist (OFL-1.1); GSAP (standard no-charge license). The model, fallback schematic, and thunder are procedural. Extra UI kits, Spline, and Rive were unnecessary. Fonts are bundled locally.

## Validation

Production build and lint pass. Lint retains 11 pre-existing warnings in the unused legacy `EnergyBotChat.tsx`; Vite retains bundle-size and future native-config compatibility warnings.

Chromium/Playwright checks exercised intro completion, actual WebGL canvas, tariff advice and action application, theme persistence, replay/skip, mobile overflow, reduced motion, and forced WebGL failure with working chat. Desktop (1440 px) and mobile (390 px) screenshots were captured in both themes under `/workspace/artifacts`. The smoke script is `/workspace/artifacts/check-electra.cjs` in this workspace.

Actual microphone recognition and audible output need a suitable browser/device and permissions; they are not guaranteed by headless checks. There is no production energy-data integration to validate.
