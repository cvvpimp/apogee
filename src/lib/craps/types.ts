export const STARTING_BANKROLL = 1000;
export const CHIP_VALUES = [1, 5, 25, 100, 500] as const;
export const POINT_NUMBERS = [4, 5, 6, 8, 9, 10] as const;
export type PointNumber = (typeof POINT_NUMBERS)[number];

export type BetKind =
  | "pass"
  | "dontPass"
  | "come"
  | "dontCome"
  | "passOdds"
  | "dontPassOdds"
  | "comeOdds"
  | "dontComeOdds"
  | "place"
  | "field"
  | "hard"
  | "any7"
  | "anyCraps"
  | "yo"
  | "aceDeuce"
  | "aces"
  | "boxcars"
  | "ce"
  | "big6"
  | "big8";

export type Bet = {
  id: string;
  kind: BetKind;
  amount: number;
  number?: number;
};

export type Phase = "comeOut" | "point";

export type TableState = {
  bankroll: number;
  bets: Bet[];
  point: number | null;
  phase: Phase;
  placeWorkingOnComeOut: boolean;
  nextBetId: number;
  buyIn: number;
};

export type GameEvent =
  | { type: "call"; text: string }
  | { type: "pay"; label: string; profit: number; stakeReturned?: boolean }
  | { type: "take"; label: string; amount: number }
  | { type: "push"; label: string }
  | { type: "move"; label: string; number: number }
  | { type: "pointOn"; point: number }
  | { type: "pointOff" }
  | { type: "sevenOut" }
  | { type: "natural" }
  | { type: "craps" };

export type RollResult = {
  state: TableState;
  events: GameEvent[];
  dice: [number, number];
  sum: number;
  hard: boolean;
};

export type PlaceError = { ok: false; reason: string };
export type PlaceOk = { ok: true; state: TableState };
export type PlaceResult = PlaceOk | PlaceError;
