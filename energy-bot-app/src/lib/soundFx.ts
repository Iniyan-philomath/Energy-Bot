// Web Audio API procedural sound synthesizer for Marvel / Avengers Sci-Fi Sound FX & Thunderstorm

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Cinematic Thunder Strike with Lightning Arc & Deep Rolling Bass Rumble
export function playLightningThunderSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // --- STAGE 1: Supersonic Arc Crack (The blinding flash crackle) ---
  const crackleLen = Math.floor(ctx.sampleRate * 0.45);
  const crackleBuf = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
  const crackleData = crackleBuf.getChannelData(0);
  for (let i = 0; i < crackleLen; i++) {
    // Sharp sporadic static pulses
    const env = Math.exp(-i / (ctx.sampleRate * 0.07));
    const noise = (Math.random() * 2 - 1);
    crackleData[i] = noise * env * (Math.random() > 0.4 ? 1 : 0.2);
  }

  const crackleSource = ctx.createBufferSource();
  crackleSource.buffer = crackleBuf;

  const crackleFilter = ctx.createBiquadFilter();
  crackleFilter.type = 'bandpass';
  crackleFilter.frequency.setValueAtTime(4200, now);
  crackleFilter.frequency.exponentialRampToValueAtTime(600, now + 0.35);
  crackleFilter.Q.value = 4.0;

  const crackleGain = ctx.createGain();
  crackleGain.gain.setValueAtTime(0.7, now);
  crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  crackleSource.connect(crackleFilter);
  crackleFilter.connect(crackleGain);
  crackleGain.connect(ctx.destination);
  crackleSource.start(now);

  // --- STAGE 2: Lightning Impact Detonation (The sharp clap) ---
  const clapOsc = ctx.createOscillator();
  const clapGain = ctx.createGain();
  clapOsc.type = 'sawtooth';
  clapOsc.frequency.setValueAtTime(380, now);
  clapOsc.frequency.exponentialRampToValueAtTime(55, now + 0.28);

  clapGain.gain.setValueAtTime(0.65, now);
  clapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  clapOsc.connect(clapGain);
  clapGain.connect(ctx.destination);
  clapOsc.start(now);
  clapOsc.stop(now + 0.35);

  // --- STAGE 3: Heavy Rolling Sub-Bass Thunder Rumble (2.5 seconds deep rolling) ---
  const rumbleDuration = 2.4;
  const rumbleBufLen = Math.floor(ctx.sampleRate * rumbleDuration);
  const rumbleBuf = ctx.createBuffer(1, rumbleBufLen, ctx.sampleRate);
  const rumbleData = rumbleBuf.getChannelData(0);
  let lastVal = 0;
  for (let i = 0; i < rumbleBufLen; i++) {
    const t = i / ctx.sampleRate;
    // Brown noise / rolling thunder fluctuation
    const white = Math.random() * 2 - 1;
    lastVal = (lastVal + 0.02 * white) / 1.02;
    // Rolling wave modulations
    const rollEnvelope = Math.sin(t * 3.5) * 0.3 + Math.sin(t * 6.2) * 0.2 + 0.5;
    const decay = Math.exp(-t * 1.1);
    rumbleData[i] = lastVal * rollEnvelope * decay * 2.8;
  }

  const rumbleSource = ctx.createBufferSource();
  rumbleSource.buffer = rumbleBuf;

  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.setValueAtTime(140, now);
  rumbleFilter.frequency.linearRampToValueAtTime(80, now + rumbleDuration);

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.setValueAtTime(0.9, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + rumbleDuration);

  rumbleSource.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(ctx.destination);
  rumbleSource.start(now);

  // Sub-bass sine boom
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(110, now);
  subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

  subGain.gain.setValueAtTime(0.8, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(now);
  subOsc.stop(now + 1.45);
}

// 2. Arc Reactor Power-Up Hum / Whir
export function playReactorPowerUpSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(65, now);
  osc.frequency.exponentialRampToValueAtTime(820, now + 1.4);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, now);
  filter.frequency.exponentialRampToValueAtTime(3200, now + 1.4);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 1.0);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.55);
}

// 3. Electric Spark / Click Zap
export function playElectricClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(2200, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

// 4. JARVIS / Stark HUD Telemetry Chirp
export function playHudChirpSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(980, now);
  osc.frequency.setValueAtTime(1520, now + 0.04);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}
