import { create } from "zustand";
import { playDice, playLose, playWin, setMuted, unlockAudio } from "@/lib/audio";
import {
  compare,
  handLine,
  handShort,
  readHand,
  rollDice,
  type Dice,
  type Hand,
} from "@/lib/street/cee-lo";
import { STARTING_BANKROLL } from "@/lib/money";

const SAVE_KEY = "white-stoop-v1";

export type Clip = "idle" | "cal" | "ned";
export type Phase = "betting" | "cal" | "ned" | "settle";

type Saved = { bankroll: number; nedBank: number; muted: boolean };

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

export type StreetStore = {
  seated: boolean;
  bankroll: number;
  nedBank: number;
  bet: number;
  selectedChip: number;
  phase: Phase;
  clip: Clip;
  clipNonce: number;
  rolling: boolean;
  dice: Dice | null;
  calHand: Hand | null;
  nedHand: Hand | null;
  line: string;
  muted: boolean;
  showRules: boolean;

  hydrate: () => void;
  sitDown: () => void;
  setChip: (n: number) => void;
  addChip: () => void;
  clearBet: () => void;
  shoot: () => void;
  nextRound: () => void;
  clipEnded: () => void;
  toggleMute: () => void;
  toggleRules: () => void;
  rebuy: () => void;
};

let calTimer = 0;
let nedTimer = 0;

export const useGame = create<StreetStore>((set, get) => ({
  seated: false,
  bankroll: STARTING_BANKROLL,
  nedBank: STARTING_BANKROLL,
  bet: 0,
  selectedChip: 25,
  phase: "betting",
  clip: "idle",
  clipNonce: 0,
  rolling: false,
  dice: null,
  calHand: null,
  nedHand: null,
  line: "Cal's mustard. Ned's the cap. Dice in the middle.",
  muted: false,
  showRules: false,

  hydrate: () => {
    const saved = loadSaved();
    if (!saved) return;
    set({
      bankroll: saved.bankroll,
      nedBank: saved.nedBank,
      muted: saved.muted,
    });
    setMuted(saved.muted);
  },

  sitDown: () => {
    unlockAudio();
    const saved = loadSaved();
    set({
      seated: true,
      clip: "idle",
      clipNonce: get().clipNonce + 1,
      bankroll: saved?.bankroll ?? STARTING_BANKROLL,
      nedBank: saved?.nedBank ?? STARTING_BANKROLL,
      line: "Put something down. Cal shoots first.",
    });
  },

  setChip: (n) => set({ selectedChip: n }),

  addChip: () => {
    const s = get();
    if (s.phase !== "betting" || s.rolling) return;
    if (s.selectedChip > s.bankroll) {
      set({ line: "Cal's short. Smaller chip." });
      return;
    }
    if (s.bet + s.selectedChip > s.nedBank) {
      set({ line: "Ned can't cover that." });
      return;
    }
    unlockAudio();
    set({
      bankroll: s.bankroll - s.selectedChip,
      bet: s.bet + s.selectedChip,
    });
    persist({ bankroll: get().bankroll, nedBank: get().nedBank, muted: get().muted });
  },

  clearBet: () => {
    const s = get();
    if (s.phase !== "betting" || s.bet <= 0) return;
    set({ bankroll: s.bankroll + s.bet, bet: 0 });
    persist({ bankroll: get().bankroll, nedBank: get().nedBank, muted: get().muted });
  },

  shoot: () => {
    const s = get();
    if (s.phase !== "betting" || s.bet <= 0 || s.rolling) return;
    unlockAudio();
    window.clearTimeout(calTimer);
    window.clearTimeout(nedTimer);
    throwFor("cal", get, set);
  },

  nextRound: () => {
    if (get().phase !== "settle") return;
    set({
      phase: "betting",
      dice: null,
      calHand: null,
      nedHand: null,
      clip: "idle",
      clipNonce: get().clipNonce + 1,
      line: "Again. Cal's the shooter.",
    });
  },

  clipEnded: () => {
    if (get().clip !== "idle") set({ clip: "idle" });
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    setMuted(muted);
    persist({ bankroll: get().bankroll, nedBank: get().nedBank, muted });
  },
  toggleRules: () => set({ showRules: !get().showRules }),
  rebuy: () => {
    set({
      bankroll: STARTING_BANKROLL,
      nedBank: STARTING_BANKROLL,
      bet: 0,
      phase: "betting",
      line: "Both pockets restuffed. Don't waste it.",
    });
    persist({ bankroll: STARTING_BANKROLL, nedBank: STARTING_BANKROLL, muted: get().muted });
  },
}));

function throwFor(
  who: "cal" | "ned",
  get: () => StreetStore,
  set: (p: Partial<StreetStore>) => void,
) {
  playDice();
  set({
    phase: who,
    clip: who,
    clipNonce: get().clipNonce + 1,
    rolling: true,
    line: who === "cal" ? "Cal shoots." : "Ned answers.",
  });

  const timer = window.setTimeout(() => {
    const dice = rollDice();
    const hand = readHand(dice);
    set({ dice, rolling: false, line: handLine(who === "cal" ? "Cal" : "Ned", hand) });

    if (hand.kind === "junk") {
      const again = window.setTimeout(() => throwFor(who, get, set), 900);
      if (who === "cal") calTimer = again;
      else nedTimer = again;
      return;
    }

    if (who === "cal") {
      set({ calHand: hand });
      if (hand.kind === "seeLo") {
        pay("cal", get, set);
        return;
      }
      if (hand.kind === "aceDeuce") {
        pay("ned", get, set);
        return;
      }
      nedTimer = window.setTimeout(() => throwFor("ned", get, set), 1100);
      return;
    }

    set({ nedHand: hand });
    if (hand.kind === "seeLo") {
      pay("ned", get, set);
      return;
    }
    if (hand.kind === "aceDeuce") {
      pay("cal", get, set);
      return;
    }
    const cal = get().calHand;
    if (!cal) {
      pay("ned", get, set);
      return;
    }
    const result = compare(cal, hand);
    if (result === "a") pay("cal", get, set);
    else if (result === "b") pay("ned", get, set);
    else pay("push", get, set);
  }, 1400);

  if (who === "cal") calTimer = timer;
  else nedTimer = timer;
}

function pay(
  winner: "cal" | "ned" | "push",
  get: () => StreetStore,
  set: (p: Partial<StreetStore>) => void,
) {
  const s = get();
  const stake = s.bet;
  let bankroll = s.bankroll;
  let nedBank = s.nedBank;
  let line = "Push. Dice stay.";
  if (winner === "cal") {
    bankroll += stake * 2;
    nedBank -= stake;
    playWin();
    line = `Cal takes it. ${s.calHand ? handShort(s.calHand) : ""} beats ${s.nedHand ? handShort(s.nedHand) : "Ned"}.`;
  } else if (winner === "ned") {
    nedBank += stake;
    playLose();
    line = `Ned takes it. ${s.nedHand ? handShort(s.nedHand) : "The cap"} beats ${s.calHand ? handShort(s.calHand) : "Cal"}.`;
  } else {
    bankroll += stake;
    line = "Push. Same street.";
  }
  set({
    phase: "settle",
    bet: 0,
    bankroll,
    nedBank: Math.max(0, nedBank),
    clip: "idle",
    clipNonce: get().clipNonce + 1,
    line,
  });
  persist({ bankroll: get().bankroll, nedBank: get().nedBank, muted: get().muted });
}
