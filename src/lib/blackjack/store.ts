import { create } from "zustand";
import {
  playChip,
  playDice,
  playLose,
  playWin,
  setMuted,
  unlockAudio,
} from "@/lib/audio";
import {
  createShoe,
  dealerShouldHit,
  draw,
  handValue,
  isBlackjack,
  outcomeLine,
  payout,
  settle,
  type Card,
  type Outcome,
} from "@/lib/blackjack/engine";
import { talkToDealer } from "@/lib/dealer";
import { STARTING_BANKROLL } from "@/lib/money";
import { pick } from "@/lib/utils";

const SAVE_KEY = "lottie-live-v1";
const CUT_CARD = 60;

export type Clip = "idle" | "shuffle" | "deal" | "talk";
export type Phase = "betting" | "player" | "dealer" | "settle";
export type ChatMsg = { id: string; role: "you" | "vic"; text: string };
export type Toast = { id: string; text: string; tone: "win" | "lose" | "info" };

type Saved = { bankroll: number; buyIn: number; muted: boolean };

function loadSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function persist(s: { bankroll: number; buyIn: number; muted: boolean }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

let chatSeq = 1;
let toastSeq = 1;

const GREETINGS = [
  "Camera's hot, sugar. Put a chip down and I'll shuffle.",
  "Live from the Midnight Line. I'm Lottie — I deal, you chase.",
  "Sit pretty. Cards are coming.",
] as const;

function snapshot(s: {
  phase: Phase;
  bet: number;
  player: Card[];
  dealer: Card[];
  holeHidden: boolean;
  bankroll: number;
}): string {
  const p = handValue(s.player).total;
  const d = s.holeHidden
    ? "hole card down"
    : String(handValue(s.dealer).total);
  return `${s.phase}. Bet $${s.bet}. Player ${p}. Dealer ${d}. Rail $${s.bankroll}.`;
}

function fallbackReply(message: string): string {
  const q = message.toLowerCase();
  if (q.includes("hit") || q.includes("stand") || q.includes("double")) {
    return "Hit if you're hungry, stand if you're scared, double when the count's pretty. I stand on all seventeens — even the soft ones, doll.";
  }
  if (q.includes("blackjack") || q.includes("pay")) {
    return "Naturals pay three-to-two. Push if we both have one. No insurance — I don't sell umbrellas.";
  }
  if (q.includes("shuffle") || q.includes("shoe")) {
    return "Six-deck shoe. When it runs thin I shuffle on camera. That's the show.";
  }
  return pick([
    "Keep your eyes on the cards, sugar. I'm watching too.",
    "Ask me hit, stand, or the pay — I'll talk shop. I won't hold your chips.",
    "Camera's rolling. Bet or chat, but don't freeze.",
  ]);
}

export type GameStore = {
  seated: boolean;
  bankroll: number;
  buyIn: number;
  bet: number;
  selectedChip: number;
  shoe: Card[];
  player: Card[];
  dealer: Card[];
  holeHidden: boolean;
  phase: Phase;
  lastOutcome: Outcome | null;
  clip: Clip;
  clipNonce: number;
  muted: boolean;
  showRules: boolean;
  vicLine: string;
  chat: ChatMsg[];
  chatBusy: boolean;
  toasts: Toast[];
  dealing: boolean;

  hydrate: () => void;
  sitDown: () => void;
  setChip: (n: number) => void;
  addChip: () => void;
  clearBet: () => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  nextHand: () => void;
  clipEnded: () => void;
  sendChat: (text: string) => Promise<void>;
  toggleMute: () => void;
  toggleRules: () => void;
  rebuy: () => void;
};

function toast(get: () => GameStore, set: (p: Partial<GameStore>) => void, text: string, tone: Toast["tone"]) {
  const id = `t${toastSeq++}`;
  set({ toasts: [...get().toasts, { id, text, tone }].slice(-3) });
  window.setTimeout(() => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  }, 2600);
}

export const useGame = create<GameStore>((set, get) => ({
  seated: false,
  bankroll: STARTING_BANKROLL,
  buyIn: STARTING_BANKROLL,
  bet: 0,
  selectedChip: 5,
  shoe: [],
  player: [],
  dealer: [],
  holeHidden: true,
  phase: "betting",
  lastOutcome: null,
  clip: "idle",
  clipNonce: 0,
  muted: false,
  showRules: false,
  vicLine: GREETINGS[0],
  chat: [],
  chatBusy: false,
  toasts: [],
  dealing: false,

  hydrate: () => {
    const saved = loadSaved();
    if (!saved) return;
    set({
      bankroll: saved.bankroll,
      buyIn: saved.buyIn,
      muted: saved.muted,
    });
    setMuted(saved.muted);
  },

  sitDown: () => {
    unlockAudio();
    const saved = loadSaved();
    set({
      seated: true,
      shoe: createShoe(),
      vicLine: "New shoe. Watch me work.",
      clip: "shuffle",
      clipNonce: get().clipNonce + 1,
      bankroll: saved?.bankroll ?? STARTING_BANKROLL,
      buyIn: saved?.buyIn ?? STARTING_BANKROLL,
    });
  },

  setChip: (n) => set({ selectedChip: n }),

  addChip: () => {
    const s = get();
    if (s.phase !== "betting" || s.dealing) return;
    if (s.selectedChip > s.bankroll) {
      set({ vicLine: "Short on the rail, sugar. Smaller chip." });
      return;
    }
    unlockAudio();
    playChip();
    const next = {
      bankroll: s.bankroll - s.selectedChip,
      bet: s.bet + s.selectedChip,
    };
    set(next);
    persist({ ...get(), ...next });
  },

  clearBet: () => {
    const s = get();
    if (s.phase !== "betting" || s.bet <= 0) return;
    set({ bankroll: s.bankroll + s.bet, bet: 0 });
    persist(get());
  },

  deal: () => {
    const s = get();
    if (s.phase !== "betting" || s.bet <= 0 || s.dealing) return;
    unlockAudio();
    playDice();
    const needsShuffle = s.shoe.length < CUT_CARD;
    set({
      dealing: true,
      clip: needsShuffle ? "shuffle" : "deal",
      clipNonce: s.clipNonce + 1,
      vicLine: needsShuffle ? "New shoe. Watch me work." : "Cards out.",
      lastOutcome: null,
    });

    window.setTimeout(() => {
      let shoe = needsShuffle ? createShoe() : get().shoe;
      const p1 = draw(shoe);
      const d1 = draw(p1.shoe);
      const p2 = draw(d1.shoe);
      const d2 = draw(p2.shoe);
      const player = [p1.card, p2.card];
      const dealer = [d1.card, d2.card];
      const pBJ = isBlackjack(player);
      const dBJ = isBlackjack(dealer);

      if (pBJ || dBJ) {
        const stake = get().bet;
        const outcome = settle(player, dealer);
        const won = payout(outcome, stake);
        const bankroll = get().bankroll + won;
        set({
          shoe: d2.shoe,
          player,
          dealer,
          holeHidden: false,
          phase: "settle",
          lastOutcome: outcome,
          dealing: false,
          clip: "talk",
          clipNonce: get().clipNonce + 1,
          vicLine: outcomeLine(outcome),
          bankroll,
          bet: 0,
        });
        if (won > stake) playWin();
        else if (won === 0) playLose();
        toast(
          get,
          set,
          won > stake ? `+$${won - stake}` : won === 0 ? `−$${stake}` : "Push",
          won > stake ? "win" : won === 0 ? "lose" : "info",
        );
        persist(get());
        return;
      }

      set({
        shoe: d2.shoe,
        player,
        dealer,
        holeHidden: true,
        phase: "player",
        dealing: false,
        vicLine: `${handValue(player).total}. Hit, stand, or double, doll.`,
      });
    }, needsShuffle ? 2800 : 1600);
  },

  hit: () => {
    const s = get();
    if (s.phase !== "player" || s.dealing) return;
    unlockAudio();
    playDice();
    set({ clip: "deal", clipNonce: get().clipNonce + 1, dealing: true });
    window.setTimeout(() => {
      const { card, shoe } = draw(get().shoe);
      const player = [...get().player, card];
      const { total } = handValue(player);
      if (total > 21) {
        set({
          shoe,
          player,
          holeHidden: false,
          phase: "settle",
          lastOutcome: "playerBust",
          dealing: false,
          clip: "talk",
          clipNonce: get().clipNonce + 1,
          vicLine: outcomeLine("playerBust"),
          bet: 0,
        });
        playLose();
        toast(get, set, "Bust", "lose");
        persist(get());
        return;
      }
      set({
        shoe,
        player,
        dealing: false,
        vicLine: `${total}. Still with me?`,
      });
    }, 900);
  },

  stand: () => {
    const s = get();
    if (s.phase !== "player" || s.dealing) return;
    playDealer(get, set);
  },

  double: () => {
    const s = get();
    if (s.phase !== "player" || s.dealing) return;
    if (s.player.length !== 2) {
      set({ vicLine: "Double's only on your first two, sugar." });
      return;
    }
    if (s.bankroll < s.bet) {
      set({ vicLine: "Need a matching chip to double." });
      return;
    }
    unlockAudio();
    playChip();
    const bet = s.bet * 2;
    set({ bankroll: s.bankroll - s.bet, bet, clip: "deal", clipNonce: s.clipNonce + 1, dealing: true });
    window.setTimeout(() => {
      const { card, shoe } = draw(get().shoe);
      const player = [...get().player, card];
      set({ shoe, player, dealing: false });
      if (handValue(player).total > 21) {
        set({
          holeHidden: false,
          phase: "settle",
          lastOutcome: "playerBust",
          clip: "talk",
          clipNonce: get().clipNonce + 1,
          vicLine: outcomeLine("playerBust"),
          bet: 0,
        });
        playLose();
        toast(get, set, "Bust", "lose");
        persist(get());
        return;
      }
      playDealer(get, set);
    }, 900);
  },

  nextHand: () => {
    const s = get();
    if (s.phase !== "settle") return;
    set({
      player: [],
      dealer: [],
      holeHidden: true,
      phase: "betting",
      lastOutcome: null,
      clip: "idle",
      clipNonce: get().clipNonce + 1,
      vicLine: "Fresh hand. Get something down.",
    });
  },

  clipEnded: () => {
    if (get().clip !== "idle") set({ clip: "idle" });
  },

  sendChat: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().chatBusy) return;
    const you: ChatMsg = { id: `c${chatSeq++}`, role: "you", text: trimmed };
    set({
      chat: [...get().chat, you].slice(-12),
      chatBusy: true,
      clip: "talk",
      clipNonce: get().clipNonce + 1,
    });
    const snap = snapshot(get());
    const history = get().chat.map((m) => ({ role: m.role, text: m.text }));
    try {
      const res = await talkToDealer({ data: { message: trimmed, snapshot: snap, history } });
      const reply = res.ok ? res.text : fallbackReply(trimmed);
      const vic: ChatMsg = { id: `c${chatSeq++}`, role: "vic", text: reply };
      set({
        chat: [...get().chat, vic].slice(-12),
        chatBusy: false,
        vicLine: reply,
      });
    } catch {
      const reply = fallbackReply(trimmed);
      const vic: ChatMsg = { id: `c${chatSeq++}`, role: "vic", text: reply };
      set({
        chat: [...get().chat, vic].slice(-12),
        chatBusy: false,
        vicLine: reply,
      });
    }
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    setMuted(muted);
    persist(get());
  },
  toggleRules: () => set({ showRules: !get().showRules }),
  rebuy: () => {
    const s = get();
    set({
      bankroll: STARTING_BANKROLL,
      buyIn: s.buyIn + STARTING_BANKROLL,
      bet: 0,
      player: [],
      dealer: [],
      phase: "betting",
      vicLine: "House staked you another grand. Don't waste my lipstick.",
    });
    persist(get());
  },
}));

function playDealer(get: () => GameStore, set: (p: Partial<GameStore>) => void) {
  set({
    phase: "dealer",
    holeHidden: false,
    clip: "deal",
    clipNonce: get().clipNonce + 1,
    dealing: true,
    vicLine: "Dealer's turn.",
  });
  const step = () => {
    const s = get();
    if (dealerShouldHit(s.dealer)) {
      playDice();
      const { card, shoe } = draw(s.shoe);
      set({ shoe, dealer: [...s.dealer, card] });
      window.setTimeout(step, 700);
      return;
    }
    const stake = s.bet;
    const outcome = settle(s.player, s.dealer);
    const won = payout(outcome, stake);
    const bankroll = s.bankroll + won;
    set({
      phase: "settle",
      lastOutcome: outcome,
      dealing: false,
      clip: "talk",
      clipNonce: get().clipNonce + 1,
      vicLine: outcomeLine(outcome),
      bankroll,
      bet: 0,
    });
    if (won > stake) playWin();
    else if (won === 0) playLose();
    toast(
      get,
      set,
      won > stake ? `+$${won - stake}` : won === 0 ? `−$${stake}` : "Push",
      won > stake ? "win" : won === 0 ? "lose" : "info",
    );
    persist(get());
  };
  window.setTimeout(step, 900);
}
