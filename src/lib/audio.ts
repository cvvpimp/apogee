let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let unlocked = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.gain.value = 0.7;
    master.gain.value = 0.85;
    sfx.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = ensure();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume();
  }
  unlocked = true;
}

export function setMuted(muted: boolean): void {
  const audio = ensure();
  if (!audio || !master) return;
  master.gain.setTargetAtTime(muted ? 0 : 0.85, audio.currentTime, 0.02);
}

function bus(): { audio: AudioContext; sfx: GainNode } | null {
  const audio = ensure();
  if (!audio || !sfx || !unlocked) return null;
  if (audio.state === "suspended") void audio.resume();
  return { audio, sfx };
}

function noiseBuffer(audio: AudioContext, seconds: number): AudioBuffer {
  const rate = audio.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = audio.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function playChip(): void {
  const nodes = bus();
  if (!nodes) return;
  const { audio, sfx } = nodes;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.value = 880 + Math.random() * 220;
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
  osc.connect(gain);
  gain.connect(sfx);
  osc.start();
  osc.stop(audio.currentTime + 0.1);
}

export function playDice(): void {
  const nodes = bus();
  if (!nodes) return;
  const { audio, sfx } = nodes;
  const src = audio.createBufferSource();
  src.buffer = noiseBuffer(audio, 0.35);
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.7;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.45, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.38);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(sfx);
  src.start();

  for (let i = 0; i < 4; i++) {
    const click = audio.createOscillator();
    const cg = audio.createGain();
    click.type = "square";
    click.frequency.value = 180 + Math.random() * 90;
    const t = audio.currentTime + 0.04 * i;
    cg.gain.setValueAtTime(0.0001, t);
    cg.gain.exponentialRampToValueAtTime(0.12, t + 0.005);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    click.connect(cg);
    cg.connect(sfx);
    click.start(t);
    click.stop(t + 0.05);
  }
}

export function playWin(): void {
  const nodes = bus();
  if (!nodes) return;
  const { audio, sfx } = nodes;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = audio.currentTime + i * 0.07;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(gain);
    gain.connect(sfx);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playLose(): void {
  const nodes = bus();
  if (!nodes) return;
  const { audio, sfx } = nodes;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(140, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(70, audio.currentTime + 0.28);
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.32);
  osc.connect(gain);
  gain.connect(sfx);
  osc.start();
  osc.stop(audio.currentTime + 0.34);
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") {
      void ctx.resume();
    }
  });
}
