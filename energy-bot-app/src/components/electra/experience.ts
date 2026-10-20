import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
export type IntroPhase = 'anticipation' | 'strike' | 'energizing' | 'reveal' | 'ready';
export function readPreference(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
export function savePreference(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage can be unavailable */ } }
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => { const q = matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setReduced(q.matches); q.addEventListener('change', change); return () => q.removeEventListener('change', change); }, []);
  return reduced;
}
// Audio is scheduled only on a running context. Suspended contexts are never queued
// for a later unrelated user gesture, so blocked autoplay cannot cause late thunder.
export function useThunder(muted: boolean) {
  const context = useRef<AudioContext | null>(null);
  const [blocked, setBlocked] = useState(false);
  const prepare = useCallback(() => {
    try {
      if (!context.current || context.current.state === 'closed') context.current = new AudioContext();
      void context.current.resume().catch(() => setBlocked(true));
    } catch { setBlocked(true); }
  }, []);
  const stop = useCallback(() => { const ctx = context.current; context.current = null; if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {}); }, []);
  const strike = useCallback(() => {
    if (muted) return;
    try {
      const ctx = context.current ?? new AudioContext(); context.current = ctx;
      if (ctx.state !== 'running') { setBlocked(true); stop(); return; }
      setBlocked(false);
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.3, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * .28));
      const source = ctx.createBufferSource(); source.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650;
      const gain = ctx.createGain(); gain.gain.value = .16;
      source.connect(filter).connect(gain).connect(ctx.destination); source.start();
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    } catch { setBlocked(true); stop(); }
  }, [muted, stop]);
  useEffect(() => { if (muted) stop(); }, [muted, stop]);
  useEffect(() => stop, [stop]);
  return { blocked, prepare, strike, stop };
}
export function useIntro(reduced: boolean, sceneReady: boolean, onStrike: () => void, onStop: () => void) {
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<IntroPhase>(() => { try { return reduced || sessionStorage.getItem('electra-intro') ? 'ready' : 'anticipation'; } catch { return reduced ? 'ready' : 'anticipation'; } });
  const strikeRef = useRef(onStrike); const stopRef = useRef(onStop);
  useEffect(() => { strikeRef.current = onStrike; stopRef.current = onStop; }, [onStrike, onStop]);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const finish = useCallback(() => { timeline.current?.kill(); setPhase('ready'); stopRef.current(); try { sessionStorage.setItem('electra-intro', '1'); } catch { /* optional persistence */ } }, []);
  useEffect(() => {
    if (reduced) { finish(); return; }
    if (phase === 'ready' && run === 0) return;
    setPhase('anticipation');
    if (!sceneReady) {
      const fallback = gsap.delayedCall(5, finish);
      return () => { fallback.kill(); };
    }
    timeline.current = gsap.timeline().call(() => { setPhase('strike'); strikeRef.current(); }, [], .65)
      .call(() => setPhase('energizing'), [], 1.25).call(() => setPhase('reveal'), [], 2.5).call(finish, [], 3.8);
    const hidden = () => { if (document.hidden) finish(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { timeline.current?.kill(); document.removeEventListener('visibilitychange', hidden); };
    // The run counter owns playback; phase changes must not restart this timeline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduced, sceneReady, finish]);
  return { phase, finish, replay: () => { if (!reduced) { setPhase('anticipation'); setRun(r => r + 1); } } };
}
