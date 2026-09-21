const HOUSE = 0.04;
const GROWTH = 0.12;

export function rollCrash(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const x = (buf[0] ?? 0) / 0x1_0000_0000;
  if (x < HOUSE) return 1;
  const raw = (1 - HOUSE) / Math.max(1e-9, 1 - x);
  return Math.max(1, Math.floor(raw * 100) / 100);
}

export function multiplierAt(seconds: number): number {
  return Math.exp(GROWTH * Math.max(0, seconds));
}

export function formatMult(n: number): string {
  return `${n.toFixed(2)}x`;
}
