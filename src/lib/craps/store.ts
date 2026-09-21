import { create } from "zustand";
import {
  playChip,
  playDice,
  playLose,
  playWin,
  setMuted,
  unlockAudio,
} from "@/lib/audio";
import { fallbackVicReply, VIC_GREETINGS, VIC_NO_BET } from "@/lib/craps/calls";
import { pick } from "@/lib/utils";
import {
  addBet,
  applyRoll,
  freshTable,
  reasonMessage,
  rollDice,
  snapshotText,
  takeBet,
} from "@/lib/craps/engine";
import { talkToDealer as talkToVic } from "@/lib/dealer";
import { amountOn } from "@/lib/craps/payouts";
import type { BetKind, GameEvent, TableState } from "@/lib/craps/types";
import { STARTING_BANKROLL } from "@/lib/craps/types";

const SAVE_KEY = "midnight-stick-v1";

export type ChatMsg = { id: string; role: "you" | "vic"; text: string };
export type Toast = { id: string; text: string; tone: "win" | "lose" | "info" };
export type RollRecord = { d1: number; d2: number; sum: number };

type Saved = {
  table: TableState;
  selectedChip: number;
  muted: boolean;
  placeWorkingOnComeOut: boolean;
};

function loadSaved(): Partial<Saved> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Saved;
  } catch {
    return null;
  }
}

function saveNow(table: TableState, selectedChip: number, muted: boolean) {
  if (typeof window === "undefined") return;
  const payload: Saved = {
    table,
    selectedChip,
    muted,
    placeWorkingOnComeOut: table.placeWorkingOnComeOut,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

let toastSeq = 1;
let chatSeq = 1;
let rollTimer: number | null = null;

export type GameStore = TableState & {
  seated: boolean;
  hydrated: boolean;
  rolling: boolean;
  pendingDice: [number, number] | null;
  dice: [number, number] | null;
  history: RollRecord[];
  selectedChip: number;
  takeMode: boolean;
  vicLine: string;
  chat: ChatMsg[];
  chatBusy: boolean;
  toasts: Toast[];
  shake: number;
  muted: boolean;
  showRules: boolean;
  reducedMotion: boolean;

  hydrate: () => void;
  sitDown: () => void;
  setChip: (n: number) => void;
  setTakeMode: (v: boolean) => void;
  toggleMute: () => void;
  toggleRules: () => void;
  togglePlaceWorking: () => void;
  tapSpot: (kind: BetKind, number?: number) => void;
  roll: () => void;
  settle: () => void;
  sendChat: (text: string) => Promise<void>;
  rebuy: () => void;
  dismissToast: (id: string) => void;
};

function pushToast(get: () => GameStore, set: (p: Partial<GameStore>) => void, text: string, tone: Toast["tone"]) {
  const id = `t${toastSeq++}`;
  set({ toasts: [...get().toasts, { id, text, tone }].slice(-4) });
  window.setTimeout(() => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  }, 2800);
}

function vicSay(set: (p: Partial<GameStore>) => void, text: string) {
  set({ vicLine: text });
}

export const useGame = create<GameStore>((set, get) => ({
  ...freshTable(),
  seated: false,
  hydrated: false,
  rolling: false,
  pendingDice: null,
  dice: null,
  history: [],
  selectedChip: 5,
  takeMode: false,
  vicLine: VIC_GREETINGS[0],
  chat: [],
  chatBusy: false,
  toasts: [],
  shake: 0,
  muted: false,
  showRules: false,
  reducedMotion: false,

  hydrate: () => {
    const saved = loadSaved();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!saved?.table) {
      set({ hydrated: true, reducedMotion: reduced });
      return;
    }
    set({
      ...saved.table,
      selectedChip: saved.selectedChip ?? 5,
      muted: saved.muted ?? false,
      hydrated: true,
      reducedMotion: reduced,
      seated: true,
      vicLine: saved.table.phase === "point"
        ? `Point is ${saved.table.point}. Odds are open.`
        : "Welcome back. Come-out roll.",
    });
    setMuted(saved.muted ?? false);
  },

  sitDown: () => {
    unlockAudio();
    const saved = loadSaved();
    if (saved?.table && (saved.table.bankroll > 0 || saved.table.bets.length > 0)) {
      set({
        ...saved.table,
        selectedChip: saved.selectedChip ?? 5,
        muted: saved.muted ?? false,
        seated: true,
        vicLine: pick([...VIC_GREETINGS]),
      });
      setMuted(saved.muted ?? false);
      return;
    }
    set({ seated: true, vicLine: pick([...VIC_GREETINGS]) });
  },

  setChip: (n) => set({ selectedChip: n }),
  setTakeMode: (v) => set({ takeMode: v }),
  toggleRules: () => set({ showRules: !get().showRules }),
  togglePlaceWorking: () => {
    const next = {
      ...get(),
      placeWorkingOnComeOut: !get().placeWorkingOnComeOut,
    };
    set({ placeWorkingOnComeOut: next.placeWorkingOnComeOut });
    saveNow(sliceTable(get()), get().selectedChip, get().muted);
  },
  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    setMuted(muted);
    saveNow(sliceTable(get()), get().selectedChip, muted);
  },

  tapSpot: (kind, number) => {
    const s = get();
    if (!s.seated || s.rolling) return;
    unlockAudio();

    if (s.takeMode) {
      const mapped = mapTake(kind, s);
      const result = takeBet(s, mapped.kind, mapped.number ?? number);
      if (!result.ok) {
        vicSay(set, reasonMessage(result.reason));
        return;
      }
      playChip();
      set({ ...result.state });
      saveNow(result.state, s.selectedChip, s.muted);
      return;
    }

    const mapped = mapAdd(kind, s, number);
    const result = addBet(s, mapped.kind, s.selectedChip, mapped.number);
    if (!result.ok) {
      vicSay(set, reasonMessage(result.reason));
      return;
    }
    playChip();
    set({ ...result.state });
    saveNow(result.state, s.selectedChip, s.muted);
  },

  roll: () => {
    const s = get();
    if (s.rolling || !s.seated) return;
    if (s.bets.length === 0) {
      vicSay(set, pick([...VIC_NO_BET]));
      return;
    }
    unlockAudio();
    playDice();
    const dice = rollDice();
    set({ rolling: true, pendingDice: dice, takeMode: false });
    if (rollTimer) window.clearTimeout(rollTimer);
    const delay = s.reducedMotion ? 80 : 1250;
    rollTimer = window.setTimeout(() => get().settle(), delay);
  },

  settle: () => {
    const s = get();
    const dice = s.pendingDice;
    if (!dice) {
      set({ rolling: false });
      return;
    }
    const result = applyRoll(s, dice[0], dice[1]);
    const profitTotal = result.events
      .filter((e): e is Extract<GameEvent, { type: "pay" }> => e.type === "pay")
      .reduce((n, e) => n + e.profit, 0);
    const lost = result.events
      .filter((e): e is Extract<GameEvent, { type: "take" }> => e.type === "take")
      .reduce((n, e) => n + e.amount, 0);
    const call = result.events.find((e) => e.type === "call");
    const sevenOut = result.events.some((e) => e.type === "sevenOut");
    const natural = result.events.some((e) => e.type === "natural");
    const pointHit = result.events.some((e) => e.type === "pointOff") && !sevenOut;

    if (sevenOut) playLose();
    else if (profitTotal > 0 || natural || pointHit) playWin();

    if (profitTotal > 0) {
      pushToast(get, set, `+$${profitTotal}`, "win");
    } else if (lost > 0 && profitTotal === 0) {
      pushToast(get, set, `−$${lost}`, "lose");
    }

    const history = [
      { d1: dice[0], d2: dice[1], sum: result.sum },
      ...s.history,
    ].slice(0, 16);

    set({
      ...result.state,
      rolling: false,
      pendingDice: null,
      dice,
      history,
      vicLine: call && call.type === "call" ? call.text : s.vicLine,
      shake: sevenOut ? 1 : profitTotal >= 50 ? 0.45 : 0,
    });
    saveNow(result.state, s.selectedChip, s.muted);

    if (result.state.bankroll <= 0 && result.state.bets.length === 0) {
      vicSay(set, "Rail's empty. House can mark you another grand.");
    }
  },

  sendChat: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().chatBusy) return;
    const you: ChatMsg = { id: `c${chatSeq++}`, role: "you", text: trimmed };
    set({
      chat: [...get().chat, you].slice(-16),
      chatBusy: true,
    });
    const dice = get().dice;
    const snapshot = snapshotText(get(), dice ? dice[0] + dice[1] : null);
    const history = get().chat.map((m) => ({ role: m.role, text: m.text }));
    try {
      const res = await talkToVic({
        data: { message: trimmed, snapshot, history },
      });
      const reply =
        res.ok
          ? res.text
          : fallbackVicReply(trimmed, snapshot);
      const vic: ChatMsg = { id: `c${chatSeq++}`, role: "vic", text: reply };
      set({
        chat: [...get().chat, vic].slice(-16),
        chatBusy: false,
        vicLine: reply,
      });
    } catch {
      const reply = fallbackVicReply(trimmed, snapshot);
      const vic: ChatMsg = { id: `c${chatSeq++}`, role: "vic", text: reply };
      set({
        chat: [...get().chat, vic].slice(-16),
        chatBusy: false,
        vicLine: reply,
      });
    }
  },

  rebuy: () => {
    const s = get();
    const table: TableState = {
      ...freshTable(),
      buyIn: s.buyIn + STARTING_BANKROLL,
      bankroll: STARTING_BANKROLL,
      placeWorkingOnComeOut: s.placeWorkingOnComeOut,
      nextBetId: s.nextBetId,
    };
    set({
      ...table,
      dice: null,
      history: [],
      vicLine: "Fresh rack. Try to last past the come-out this time.",
      takeMode: false,
    });
    saveNow(table, s.selectedChip, s.muted);
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

function sliceTable(s: GameStore): TableState {
  return {
    bankroll: s.bankroll,
    bets: s.bets,
    point: s.point,
    phase: s.phase,
    placeWorkingOnComeOut: s.placeWorkingOnComeOut,
    nextBetId: s.nextBetId,
    buyIn: s.buyIn,
  };
}

function mapAdd(
  kind: BetKind,
  s: GameStore,
  number?: number,
): { kind: BetKind; number?: number } {
  if (kind === "pass" && s.phase === "point") {
    return { kind: "passOdds" };
  }
  if (kind === "dontPass" && s.phase === "point") {
    return { kind: "dontPassOdds" };
  }
  return { kind, number };
}

function mapTake(
  kind: BetKind,
  s: GameStore,
): { kind: BetKind; number?: number } {
  if (kind === "pass" && s.phase === "point" && amountOn(s.bets, "passOdds") > 0) {
    return { kind: "passOdds" };
  }
  if (
    kind === "dontPass" &&
    s.phase === "point" &&
    amountOn(s.bets, "dontPassOdds") > 0
  ) {
    return { kind: "dontPassOdds" };
  }
  return { kind };
}

export function sessionPnL(s: Pick<GameStore, "bankroll" | "bets" | "buyIn">): number {
  return s.bankroll + s.bets.reduce((n, b) => n + b.amount, 0) - s.buyIn;
}
