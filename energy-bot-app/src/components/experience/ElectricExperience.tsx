/**
 * ElectricExperience.tsx
 * Exports AnimatePresence (framer-motion re-export) and a lightweight
 * pointer-responsive colour-field for the welcome state.
 * The thunder intro, lightning canvas, rotating coil/Reactor, and
 * ElectricCursor trail have been removed.
 */
export { AnimatePresence } from "framer-motion";

// No-op cursor — kept so existing import in App.tsx doesn't break.
// The full-screen cursor blob is gone; subtle hover states live in CSS.
export function ElectricCursor() {
  return null;
}

// No-op PowerIntro — thunder gate removed.
export function PowerIntro({ onFinish }: { onFinish: () => void }) {
  // Immediately finish so nothing blocks the app.
  if (typeof window !== "undefined") {
    Promise.resolve().then(onFinish);
  }
  return null;
}

// No-op Reactor — coil removed.
export function Reactor() {
  return null;
}
