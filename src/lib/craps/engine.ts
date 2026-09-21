import { callRoll } from "./calls";
import {
  amountOn,
  canTakeDown,
  describeBet,
  fieldRatio,
  hardRatio,
  isPointNumber,
  layOddsRatio,
  maxOddsMultiplier,
  oddsRatio,
  placeRatio,
  profit,
} from "./payouts";
import {
  STARTING_BANKROLL,
  type Bet,
  type BetKind,
  type GameEvent,
  type PlaceResult,
  type RollResult,
  type TableState,
} from "./types";

export function freshTable(): TableState {
  return {
    bankroll: STARTING_BANKROLL,
    bets: [],
    point: null,
    phase: "comeOut",
    placeWorkingOnComeOut: false,
    nextBetId: 1,
    buyIn: STARTING_BANKROLL,
  };
}

export function rollDice(): [number, number] {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return [((buf[0] ?? 0) % 6) + 1, ((buf[1] ?? 0) % 6) + 1];
}

function nextId(state: TableState): { id: string; nextBetId: number } {
  return { id: `b${state.nextBetId}`, nextBetId: state.nextBetId + 1 };
}

function consolidate(bets: Bet[]): Bet[] {
  const map = new Map<string, Bet>();
  for (const bet of bets) {
    const key = `${bet.kind}:${bet.number ?? ""}`;
    const prev = map.get(key);
    if (prev) {
      prev.amount += bet.amount;
    } else {
      map.set(key, { ...bet });
    }
  }
  return [...map.values()];
}

export function legalBet(
  state: TableState,
  kind: BetKind,
  number?: number,
): { ok: true } | { ok: false; reason: string } {
  const phase = state.phase;
  switch (kind) {
    case "pass":
      if (phase !== "comeOut") {
        return { ok: false, reason: "pass-closed" };
      }
      return { ok: true };
    case "dontPass":
      if (phase !== "comeOut") {
        return { ok: false, reason: "dont-closed" };
      }
      return { ok: true };
    case "come":
    case "dontCome":
      if (phase !== "point") {
        return { ok: false, reason: "come-closed" };
      }
      return { ok: true };
    case "passOdds": {
      const line = amountOn(state.bets, "pass");
      if (phase !== "point" || !state.point || line <= 0) {
        return { ok: false, reason: "no-odds" };
      }
      return { ok: true };
    }
    case "dontPassOdds": {
      const line = amountOn(state.bets, "dontPass");
      if (phase !== "point" || !state.point || line <= 0) {
        return { ok: false, reason: "no-odds" };
      }
      return { ok: true };
    }
    case "comeOdds": {
      if (number == null) return { ok: false, reason: "no-odds" };
      const line = amountOn(state.bets, "come", number);
      if (line <= 0) return { ok: false, reason: "no-odds" };
      return { ok: true };
    }
    case "dontComeOdds": {
      if (number == null) return { ok: false, reason: "no-odds" };
      const line = amountOn(state.bets, "dontCome", number);
      if (line <= 0) return { ok: false, reason: "no-odds" };
      return { ok: true };
    }
    case "place":
    case "hard":
      if (number == null || !isPointNumber(number)) {
        return { ok: false, reason: "need-number" };
      }
      if (kind === "hard" && (number === 5 || number === 9)) {
        return { ok: false, reason: "need-number" };
      }
      return { ok: true };
    default:
      return { ok: true };
  }
}

function oddsCap(
  state: TableState,
  kind: BetKind,
  number: number | undefined,
  extra: number,
): { ok: true } | { ok: false; reason: string } {
  const pointish =
    number ??
    (kind === "passOdds" || kind === "dontPassOdds" ? state.point : undefined);
  if (pointish == null) return { ok: true };

  let line = 0;
  let current = 0;
  if (kind === "passOdds") {
    line = amountOn(state.bets, "pass");
    current = amountOn(state.bets, "passOdds");
  } else if (kind === "dontPassOdds") {
    line = amountOn(state.bets, "dontPass");
    current = amountOn(state.bets, "dontPassOdds");
  } else if (kind === "comeOdds") {
    line = amountOn(state.bets, "come", pointish);
    current = amountOn(state.bets, "comeOdds", pointish);
  } else if (kind === "dontComeOdds") {
    line = amountOn(state.bets, "dontCome", pointish);
    current = amountOn(state.bets, "dontComeOdds", pointish);
  } else {
    return { ok: true };
  }

  const cap = line * maxOddsMultiplier(pointish);
  if (current + extra > cap) {
    return { ok: false, reason: "odds-max" };
  }
  return { ok: true };
}

export function addBet(
  state: TableState,
  kind: BetKind,
  amount: number,
  number?: number,
): PlaceResult {
  if (amount <= 0) return { ok: false, reason: "short" };
  if (amount > state.bankroll) return { ok: false, reason: "short" };

  const legal = legalBet(state, kind, number);
  if (!legal.ok) return legal;

  const cap = oddsCap(state, kind, number, amount);
  if (!cap.ok) return cap;

  const { id, nextBetId } = nextId(state);
  const bet: Bet = { id, kind, amount };
  if (
    number != null &&
    (kind === "place" ||
      kind === "hard" ||
      kind === "comeOdds" ||
      kind === "dontComeOdds")
  ) {
    bet.number = number;
  }

  return {
    ok: true,
    state: {
      ...state,
      bankroll: state.bankroll - amount,
      bets: consolidate([...state.bets, bet]),
      nextBetId,
    },
  };
}

export function takeBet(
  state: TableState,
  kind: BetKind,
  number?: number,
): PlaceResult {
  if (!canTakeDown(kind)) return { ok: false, reason: "contract" };
  const idx = state.bets.findIndex(
    (b) => b.kind === kind && (number == null || b.number === number),
  );
  if (idx < 0) return { ok: false, reason: "empty" };
  const bet = state.bets[idx]!;
  const bets = state.bets.filter((_, i) => i !== idx);
  return {
    ok: true,
    state: {
      ...state,
      bankroll: state.bankroll + bet.amount,
      bets,
    },
  };
}

type Work = {
  bets: Bet[];
  bankroll: number;
  events: GameEvent[];
};

function labelOf(bet: Bet): string {
  return describeBet(bet);
}

function takeMatching(work: Work, pred: (b: Bet) => boolean, reason?: string) {
  const kept: Bet[] = [];
  for (const bet of work.bets) {
    if (pred(bet)) {
      work.events.push({
        type: "take",
        label: reason ?? labelOf(bet),
        amount: bet.amount,
      });
    } else {
      kept.push(bet);
    }
  }
  work.bets = kept;
}

function payKeep(work: Work, pred: (b: Bet) => boolean, num: number, den: number) {
  for (const bet of work.bets) {
    if (!pred(bet)) continue;
    const p = profit(bet.amount, num, den);
    work.bankroll += p;
    work.events.push({
      type: "pay",
      label: labelOf(bet),
      profit: p,
    });
  }
}

function payRemove(
  work: Work,
  pred: (b: Bet) => boolean,
  num: number,
  den: number,
) {
  const kept: Bet[] = [];
  for (const bet of work.bets) {
    if (!pred(bet)) {
      kept.push(bet);
      continue;
    }
    const p = profit(bet.amount, num, den);
    work.bankroll += bet.amount + p;
    work.events.push({
      type: "pay",
      label: labelOf(bet),
      profit: p,
      stakeReturned: true,
    });
  }
  work.bets = kept;
}

function resolveOneRoll(work: Work, sum: number) {
  const hits = (kind: BetKind, win: boolean, num: number, den: number) => {
    if (win) payRemove(work, (b) => b.kind === kind, num, den);
    else takeMatching(work, (b) => b.kind === kind);
  };

  hits("any7", sum === 7, 4, 1);
  hits("anyCraps", sum === 2 || sum === 3 || sum === 12, 7, 1);
  hits("yo", sum === 11, 15, 1);
  hits("aceDeuce", sum === 3, 15, 1);
  hits("aces", sum === 2, 30, 1);
  hits("boxcars", sum === 12, 30, 1);

  // C & E: half on craps (3:1), half on eleven (7:1)
  const ce = work.bets.filter((b) => b.kind === "ce");
  if (ce.length) {
    const craps = sum === 2 || sum === 3 || sum === 12;
    const yo = sum === 11;
    if (craps) {
      payRemove(work, (b) => b.kind === "ce", 3, 2); // 3:1 on half ≈ 3:2 on whole
    } else if (yo) {
      payRemove(work, (b) => b.kind === "ce", 7, 2); // 7:1 on half ≈ 7:2 on whole
    } else {
      takeMatching(work, (b) => b.kind === "ce");
    }
  }

  const field = fieldRatio(sum);
  if (field) {
    payRemove(work, (b) => b.kind === "field", field[0], field[1]);
  } else {
    takeMatching(work, (b) => b.kind === "field");
  }
}

function resolveHardways(work: Work, sum: number, hard: boolean) {
  const isHardNum = (n: number) => n === 4 || n === 6 || n === 8 || n === 10;
  takeMatching(work, (b) => {
    if (b.kind !== "hard" || b.number == null) return false;
    if (sum === 7) return true;
    if (b.number === sum && isHardNum(sum) && !hard) return true;
    return false;
  });
  if (hard && isHardNum(sum)) {
    const [num, den] = hardRatio(sum);
    payKeep(work, (b) => b.kind === "hard" && b.number === sum, num, den);
  }
}

function placeIsWorking(state: TableState): boolean {
  return state.phase === "point" || state.placeWorkingOnComeOut;
}

function resolvePlaceAndBig(
  work: Work,
  state: TableState,
  sum: number,
) {
  const working = placeIsWorking(state);
  if (sum === 7) {
    if (working) takeMatching(work, (b) => b.kind === "place");
    takeMatching(work, (b) => b.kind === "big6" || b.kind === "big8");
    return;
  }
  if (working && isPointNumber(sum)) {
    const [num, den] = placeRatio(sum);
    payKeep(work, (b) => b.kind === "place" && b.number === sum, num, den);
  }
  if (sum === 6) {
    payKeep(work, (b) => b.kind === "big6", 1, 1);
  }
  if (sum === 8) {
    payKeep(work, (b) => b.kind === "big8", 1, 1);
  }
}

function resolveNumberedCome(work: Work, sum: number, sevenOut: boolean) {
  if (sevenOut) {
    takeMatching(work, (b) => b.kind === "come" && b.number != null);
    takeMatching(work, (b) => b.kind === "comeOdds");
    payRemove(work, (b) => b.kind === "dontCome" && b.number != null, 1, 1);
    for (const bet of [...work.bets]) {
      if (bet.kind !== "dontComeOdds" || bet.number == null) continue;
      const [num, den] = layOddsRatio(bet.number);
      payRemove(work, (b) => b.id === bet.id, num, den);
    }
    return;
  }

  // Number hit: come on that number wins, don't come loses
  payRemove(work, (b) => b.kind === "come" && b.number === sum, 1, 1);
  if (isPointNumber(sum)) {
    const [on, od] = oddsRatio(sum);
    payRemove(work, (b) => b.kind === "comeOdds" && b.number === sum, on, od);
  }
  takeMatching(work, (b) => b.kind === "dontCome" && b.number === sum);
  takeMatching(work, (b) => b.kind === "dontComeOdds" && b.number === sum);
}

function resolveUnnumberedCome(work: Work, sum: number) {
  const inCome = (b: Bet) => b.kind === "come" && b.number == null;
  const inDc = (b: Bet) => b.kind === "dontCome" && b.number == null;

  if (sum === 7 || sum === 11) {
    payKeep(work, inCome, 1, 1);
    takeMatching(work, inDc);
    return;
  }
  if (sum === 2 || sum === 3) {
    takeMatching(work, inCome);
    payKeep(work, inDc, 1, 1);
    return;
  }
  if (sum === 12) {
    takeMatching(work, inCome);
    for (const bet of work.bets) {
      if (inDc(bet)) work.events.push({ type: "push", label: labelOf(bet) });
    }
    return;
  }
  if (isPointNumber(sum)) {
    work.bets = work.bets.map((b) => {
      if (inCome(b) || inDc(b)) {
        work.events.push({ type: "move", label: labelOf(b), number: sum });
        return { ...b, number: sum };
      }
      return b;
    });
    work.bets = consolidate(work.bets);
  }
}

function resolveLine(
  work: Work,
  state: TableState,
  sum: number,
  sevenOut: boolean,
  pointHit: boolean,
  natural: boolean,
  craps: boolean,
) {
  const pass = (b: Bet) => b.kind === "pass";
  const dp = (b: Bet) => b.kind === "dontPass";

  if (state.phase === "comeOut") {
    if (natural) {
      payKeep(work, pass, 1, 1);
      takeMatching(work, dp);
    } else if (craps) {
      takeMatching(work, pass);
      if (sum === 12) {
        for (const bet of work.bets) {
          if (dp(bet)) work.events.push({ type: "push", label: labelOf(bet) });
        }
      } else {
        payKeep(work, dp, 1, 1);
      }
    }
    return;
  }

  if (sevenOut) {
    takeMatching(work, pass);
    takeMatching(work, (b) => b.kind === "passOdds");
    payKeep(work, dp, 1, 1);
    if (state.point) {
      const [num, den] = layOddsRatio(state.point);
      payRemove(work, (b) => b.kind === "dontPassOdds", num, den);
    } else {
      takeMatching(work, (b) => b.kind === "dontPassOdds");
    }
    return;
  }

  if (pointHit) {
    payKeep(work, pass, 1, 1);
    if (state.point) {
      const [num, den] = oddsRatio(state.point);
      payRemove(work, (b) => b.kind === "passOdds", num, den);
    }
    takeMatching(work, dp);
    takeMatching(work, (b) => b.kind === "dontPassOdds");
  }
}

export function applyRoll(
  state: TableState,
  d1: number,
  d2: number,
): RollResult {
  const sum = d1 + d2;
  const hard = d1 === d2;
  const natural = state.phase === "comeOut" && (sum === 7 || sum === 11);
  const craps = state.phase === "comeOut" && (sum === 2 || sum === 3 || sum === 12);
  const sevenOut = state.phase === "point" && sum === 7;
  const pointHit = state.phase === "point" && state.point === sum;
  const pointEstablished =
    state.phase === "comeOut" && isPointNumber(sum) ? sum : null;

  const work: Work = {
    bets: state.bets.map((b) => ({ ...b })),
    bankroll: state.bankroll,
    events: [],
  };

  resolveOneRoll(work, sum);
  resolveHardways(work, sum, hard);
  resolvePlaceAndBig(work, state, sum);
  resolveNumberedCome(work, sum, sevenOut);
  resolveUnnumberedCome(work, sum);
  resolveLine(work, state, sum, sevenOut, pointHit, natural, craps);

  let phase = state.phase;
  let point = state.point;

  if (sevenOut || pointHit) {
    phase = "comeOut";
    point = null;
    work.events.push({ type: "pointOff" });
    if (sevenOut) work.events.push({ type: "sevenOut" });
  } else if (pointEstablished != null) {
    phase = "point";
    point = pointEstablished;
    work.events.push({ type: "pointOn", point: pointEstablished });
  }
  if (natural) work.events.push({ type: "natural" });
  if (craps) work.events.push({ type: "craps" });

  const call = callRoll({
    d1,
    d2,
    sum,
    hard,
    sevenOut,
    pointHit,
    natural,
    craps,
    pointEstablished,
    phaseWas: state.phase,
  });
  work.events.unshift({ type: "call", text: call });

  const next: TableState = {
    ...state,
    bankroll: work.bankroll,
    bets: work.bets,
    phase,
    point,
  };

  return { state: next, events: work.events, dice: [d1, d2], sum, hard };
}

export function snapshotText(state: TableState, lastSum: number | null): string {
  const bets =
    state.bets.length === 0
      ? "no bets"
      : state.bets.map((b) => `${describeBet(b)} $${b.amount}`).join(", ");
  const phase =
    state.phase === "comeOut"
      ? "Come-out roll (no point)"
      : `Point is ${state.point}`;
  const last = lastSum == null ? "no roll yet" : `last roll ${lastSum}`;
  return `${phase}. Bankroll $${state.bankroll}. On the felt: ${bets}. ${last}.`;
}

export function reasonMessage(reason: string): string {
  switch (reason) {
    case "pass-closed":
      return "Line's closed. Point's on — take odds or play Come.";
    case "dont-closed":
      return "Don't is closed. Lay odds or Don't Come.";
    case "come-closed":
      return "Come's only open once we have a point, shooter.";
    case "no-odds":
      return "No line bet to take odds on.";
    case "odds-max":
      return "That's the roof on odds. 3-4-5x, house way.";
    case "contract":
      return "That's a contract bet. It stays until it wins or dies.";
    case "short":
      return "Short on the rail. Buy in or take a smaller chip.";
    case "empty":
      return "Nothing there to take down.";
    default:
      return "Can't put that down right now.";
  }
}
