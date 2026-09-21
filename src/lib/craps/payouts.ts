import type { Bet, BetKind, TableState } from "./types";
import { POINT_NUMBERS } from "./types";

export function isPointNumber(n: number): n is 4 | 5 | 6 | 8 | 9 | 10 {
  return (POINT_NUMBERS as readonly number[]).includes(n);
}

export function profit(amount: number, num: number, den: number): number {
  return Math.floor((amount * num) / den);
}

/** True odds paid on pass/come odds. */
export function oddsRatio(n: number): [number, number] {
  if (n === 4 || n === 10) return [2, 1];
  if (n === 5 || n === 9) return [3, 2];
  return [6, 5];
}

/** Lay odds paid on don't pass / don't come odds. */
export function layOddsRatio(n: number): [number, number] {
  if (n === 4 || n === 10) return [1, 2];
  if (n === 5 || n === 9) return [2, 3];
  return [5, 6];
}

export function placeRatio(n: number): [number, number] {
  if (n === 4 || n === 10) return [9, 5];
  if (n === 5 || n === 9) return [7, 5];
  return [7, 6];
}

/** Classic Vegas 3-4-5x odds. */
export function maxOddsMultiplier(n: number): number {
  if (n === 4 || n === 10) return 3;
  if (n === 5 || n === 9) return 4;
  return 5;
}

export function hardRatio(n: number): [number, number] {
  if (n === 4 || n === 10) return [7, 1];
  return [9, 1];
}

export const FIELD_NUMBERS = [2, 3, 4, 9, 10, 11, 12] as const;

export function fieldRatio(sum: number): [number, number] | null {
  if (sum === 2 || sum === 12) return [2, 1];
  if ((FIELD_NUMBERS as readonly number[]).includes(sum)) return [1, 1];
  return null;
}

export function amountOn(
  bets: Bet[],
  kind: BetKind,
  number?: number,
): number {
  return bets
    .filter((b) => b.kind === kind && (number === undefined || b.number === number))
    .reduce((s, b) => s + b.amount, 0);
}

export function findBet(
  bets: Bet[],
  kind: BetKind,
  number?: number,
): Bet | undefined {
  return bets.find(
    (b) => b.kind === kind && (number === undefined ? true : b.number === number),
  );
}

export function tableMoney(state: TableState): number {
  return state.bets.reduce((s, b) => s + b.amount, 0);
}

export function equity(state: TableState): number {
  return state.bankroll + tableMoney(state);
}

export const BET_LABELS: Record<BetKind, string> = {
  pass: "Pass Line",
  dontPass: "Don't Pass",
  come: "Come",
  dontCome: "Don't Come",
  passOdds: "Pass Odds",
  dontPassOdds: "Don't Odds",
  comeOdds: "Come Odds",
  dontComeOdds: "Don't Come Odds",
  place: "Place",
  field: "Field",
  hard: "Hardway",
  any7: "Any Seven",
  anyCraps: "Any Craps",
  yo: "Yo Eleven",
  aceDeuce: "Ace-Deuce",
  aces: "Aces",
  boxcars: "Boxcars",
  ce: "C & E",
  big6: "Big 6",
  big8: "Big 8",
};

export function describeBet(bet: Bet): string {
  const base = BET_LABELS[bet.kind];
  if (bet.number != null && (bet.kind === "place" || bet.kind === "hard")) {
    return `${base} ${bet.number}`;
  }
  if (bet.number != null && (bet.kind === "come" || bet.kind === "dontCome")) {
    return `${base} ${bet.number}`;
  }
  if (
    bet.number != null &&
    (bet.kind === "comeOdds" || bet.kind === "dontComeOdds")
  ) {
    return `${base} ${bet.number}`;
  }
  return base;
}

export function canTakeDown(kind: BetKind): boolean {
  return (
    kind === "place" ||
    kind === "passOdds" ||
    kind === "dontPassOdds" ||
    kind === "comeOdds" ||
    kind === "dontComeOdds" ||
    kind === "field" ||
    kind === "hard" ||
    kind === "any7" ||
    kind === "anyCraps" ||
    kind === "yo" ||
    kind === "aceDeuce" ||
    kind === "aces" ||
    kind === "boxcars" ||
    kind === "ce" ||
    kind === "big6" ||
    kind === "big8"
  );
}
