import { create } from "zustand";
import { playBoom, playRumble, playWin, setMuted, stopRumble, unlockAudio } from "@/lib/audio";
import { STARTING_BANKROLL } from "@/lib/money";
import { formatMult, multiplierAt, rollCrash } from "@/lib/crash/engine";

const SAVE_KEY = "apogee-v1";
const HISTORY = 8;

type Phase = "betting" | "flying" | "crashed";

type Saved = { bankroll: number; muted: boolean };

function loadSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function persist(s: Saved) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

export type CrashStore = {
  bankroll: number;
  bet: number;
  selectedChip: number;
  phase: Phase;
  multiplier: number;
  crashAt: number;
  cashedAt: number | null;
  history: number[];
  line: string;
  muted: boolean;
  shake: number;
  showRules: boolean;

  hydrate: () => void;
  setChip: (n: number) => void;
  addChip: () => void;
  clearBet: () => void;
  launch: () => void;
  tick: (seconds: number) => void;
  cashOut: () => void;
  nextRound: () => void;
  toggleMute: () => void;
  toggleRules: () => void;
  rebuy: () => void;
};

export const useGame = create<CrashStore>((set, get) => ({
  bankroll: STARTING_BANKROLL,
  bet: 0,
  selectedChip: 25,
  phase: "betting",
  multiplier: 1,
  crashAt: 1,
  cashedAt: null,
  history: [],
  line: "Stake it. Launch. Cash out before it folds.",
  muted: false,
  shake: 0,
  showRules: false,

  hydrate: () => {
    const saved = loadSaved();
    if (!saved) return;
    set({ bankroll: saved.bankroll, muted: saved.muted });
    setMuted(saved.muted);
  },

  setChip: (n) => set({ selectedChip: n }),

  addChip: () => {
    const s = get();
    if (s.phase !== "betting") return;
    if (s.selectedChip > s.bankroll) {
      set({ line: "Short. Smaller chip." });
      return;
    }
    unlockAudio();
    set({
      bankroll: s.bankroll - s.selectedChip,
      bet: s.bet + s.selectedChip,
    });
    persist({ bankroll: get().bankroll, muted: get().muted });
  },

  clearBet: () => {
    const s = get();
    if (s.phase !== "betting" || s.bet <= 0) return;
    set({ bankroll: s.bankroll + s.bet, bet: 0 });
    persist({ bankroll: get().bankroll, muted: get().muted });
  },

  launch: () => {
    const s = get();
    if (s.phase !== "betting" || s.bet <= 0) return;
    unlockAudio();
    playRumble();
    set({
      phase: "flying",
      multiplier: 1,
      crashAt: rollCrash(),
      cashedAt: null,
      shake: 0,
      line: "She's climbing. Cash out when you like it.",
    });
  },

  tick: (seconds) => {
    const s = get();
    if (s.phase !== "flying") return;
    const m = multiplierAt(seconds);
    if (m >= s.crashAt) {
      stopRumble();
      playBoom();
      const history = [s.crashAt, ...s.history].slice(0, HISTORY);
      const cashed = s.cashedAt;
      set({
        phase: "crashed",
        multiplier: s.crashAt,
        history,
        shake: 1,
        line: cashed
          ? `Crashed ${formatMult(s.crashAt)}. You were off at ${formatMult(cashed)}.`
          : `Crashed ${formatMult(s.crashAt)}. Stake's gone.`,
        bet: cashed ? 0 : 0,
      });
      persist({ bankroll: get().bankroll, muted: get().muted });
      return;
    }
    set({ multiplier: m });
  },

  cashOut: () => {
    const s = get();
    if (s.phase !== "flying" || s.cashedAt !== null || s.bet <= 0) return;
    const payout = Math.floor(s.bet * s.multiplier);
    playWin();
    set({
      cashedAt: s.multiplier,
      bankroll: s.bankroll + payout,
      bet: 0,
      line: `Cashed ${formatMult(s.multiplier)}. +$${payout.toLocaleString("en-US")}. She's still flying.`,
    });
    persist({ bankroll: get().bankroll, muted: get().muted });
  },

  nextRound: () => {
    if (get().phase !== "crashed") return;
    set({
      phase: "betting",
      multiplier: 1,
      cashedAt: null,
      shake: 0,
      line: "Again.",
    });
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    setMuted(muted);
    persist({ bankroll: get().bankroll, muted });
  },
  toggleRules: () => set({ showRules: !get().showRules }),
  rebuy: () => {
    set({
      bankroll: STARTING_BANKROLL,
      bet: 0,
      phase: "betting",
      line: "Pockets restuffed.",
    });
    persist({ bankroll: STARTING_BANKROLL, muted: get().muted });
  },
}));
