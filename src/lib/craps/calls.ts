import { pick } from "@/lib/utils";

const NUMBER_TALK: Record<number, string[]> = {
  2: ["Aces", "Snake eyes", "Two craps"],
  3: ["Ace-deuce", "Three craps", "Easy three"],
  4: ["Little Joe", "Four", "Little Joe from Kokomo"],
  5: ["Fever five", "Five", "No field five"],
  6: ["Six", "Easy six", "Sixie from Dixie"],
  7: ["Seven", "Big red", "Seven out"],
  8: ["Eighter", "Eight", "Eighter from Decatur"],
  9: ["Nina", "Nine", "Center field nine"],
  10: ["Ten", "Puppy paws", "The ten"],
  11: ["Yo", "Yo-leven", "Six five, yo"],
  12: ["Boxcars", "Midnight", "Twelve craps"],
};

export function numberTalk(sum: number, hard: boolean): string {
  if (hard && (sum === 4 || sum === 6 || sum === 8 || sum === 10)) {
    return `Hard ${sum}`;
  }
  return pick(NUMBER_TALK[sum] ?? [String(sum)]);
}

export function callRoll(opts: {
  d1: number;
  d2: number;
  sum: number;
  hard: boolean;
  sevenOut: boolean;
  pointHit: boolean;
  natural: boolean;
  craps: boolean;
  pointEstablished: number | null;
  phaseWas: "comeOut" | "point";
}): string {
  const { sum, hard, d1, d2 } = opts;
  const hop = `${d1}–${d2}`;

  if (opts.sevenOut) {
    return pick([
      `Seven! Out. Line away. ${hop}.`,
      `Big red, seven out. Take the line, pay the don't.`,
      `Seven out — that's a wrap on the point. Line away.`,
    ]);
  }

  if (opts.natural) {
    if (sum === 11) {
      return pick([
        "Yo-leven! Front line winner.",
        "Six-five, yo! Pay the line, take the don't.",
      ]);
    }
    return pick([
      "Seven! Front line winner. Pay the pass.",
      "Winner seven. Take the don't, pay the line.",
    ]);
  }

  if (opts.craps) {
    if (sum === 2) {
      return pick([
        "Aces. Craps, line away.",
        "Snake eyes. Two craps — take the line, pay the don't.",
      ]);
    }
    if (sum === 3) {
      return pick([
        "Ace-deuce. Craps, line away.",
        "Three craps. Pay the don't, take the pass.",
      ]);
    }
    return pick([
      "Boxcars. Twelve, craps. Line away. Don't is bar.",
      "Midnight. Twelve craps — line away, don't push.",
    ]);
  }

  if (opts.pointHit) {
    const name = numberTalk(sum, hard);
    return pick([
      `Winner ${name}! Pay the line, take the don't.`,
      `The point! ${name} is a winner. Front line paid.`,
    ]);
  }

  if (opts.pointEstablished != null) {
    const n = opts.pointEstablished;
    return pick([
      `${numberTalk(n, hard)}. Mark the ${n}. Point is ${n}.`,
      `${hop}, ${n}. The point is ${n}. Odds are open.`,
    ]);
  }

  // Working-number hop during a point
  if (hard) {
    return pick([
      `${hop}. Hard ${sum}!`,
      `Hard ${sum} coming. ${hop}.`,
    ]);
  }
  if (sum === 11) {
    return pick(["Yo-leven. One roll.", "Six-five, yo."]);
  }
  if (sum === 2 || sum === 3 || sum === 12) {
    return `${numberTalk(sum, false)}. One roll.`;
  }
  return pick([
    `${hop}, ${numberTalk(sum, false)}.`,
    `${numberTalk(sum, false)}. ${hop}.`,
  ]);
}

export const VIC_GREETINGS = [
  "Dice are out. Get something down.",
  "Sit down, shooter. Pass line's open.",
  "Midnight shift. I'm Vic — I call 'em, you chase 'em.",
] as const;

export const VIC_NO_BET = [
  "Can't shoot light. Put something on the line.",
  "Need a bet down before those bones fly.",
  "This isn't a museum. Chip in or sit tight.",
] as const;

export const VIC_SHORT = [
  "Short on the rail. Buy in or take a smaller chip.",
  "That's more than you've got. Count it again.",
] as const;

export const VIC_CLOSED = {
  pass: "Line's closed. Point's on — take odds or play Come.",
  dontPass: "Don't is closed. Lay odds or Don't Come.",
  come: "Come's only open once we have a point.",
  dontCome: "Don't Come waits on a point.",
  odds: "No line bet to take odds on.",
  oddsMax: "That's the roof on odds. 3-4-5x, house way.",
  contract: "That's a contract bet. It stays until it wins or dies.",
} as const;

export const VIC_REBUY = [
  "House will stake you another grand. Don't make me regret it.",
  "Fresh rack. Try to last past the come-out this time.",
] as const;

export function fallbackVicReply(message: string, snapshot: string): string {
  const q = message.toLowerCase();
  if (q.includes("odds")) {
    return "Odds are the only even bet on the felt. 4 and 10 pay 2-to-1, 5 and 9 pay 3-to-2, 6 and 8 pay 6-to-5. 3-4-5x the line. Take 'em if you've got a pass bet working.";
  }
  if (q.includes("come")) {
    return "Come works like a delayed Pass. Drop it during a point. 7 or 11 pays now; 2, 3, 12 dies; anything else and that chip moves to the number.";
  }
  if (q.includes("don't") || q.includes("dont")) {
    return "Don't Pass is the dark side. 2 and 3 win on the come-out, 12 is a push — we bar the twelve — 7 and 11 lose. Once a point's up, you want a seven before they hit it.";
  }
  if (q.includes("place")) {
    return "Place a number and you're betting it hits before seven. Six and eight pay 7-for-6, five and nine 7-for-5, four and ten 9-for-5. They sit off on the come-out unless you tell me working.";
  }
  if (q.includes("field")) {
    return "Field is a one-roll hop. 2, 3, 4, 9, 10, 11, 12. Two and twelve pay double. Five, six, seven, eight and you're in the dirt.";
  }
  if (q.includes("point")) {
    return snapshot.includes("Point")
      ? "Point's up. Line's locked. Take odds behind it, or play Come and the numbers."
      : "No point yet — this is the come-out. Pass wants 7 or 11. 2, 3, 12 is craps.";
  }
  if (q.includes("best") || q.includes("should") || q.includes("bet")) {
    return "Smart money is Pass plus full odds. Lowest edge on the table. Place the 6 and 8 if you want action during a point. Leave the horn alone unless you're feeling poetic.";
  }
  if (q.includes("seven") || q.includes("out")) {
    return "Seven's the boss. Pays the Don't, kills the line, the come numbers, the place bets, the hardways. Big red ends the round.";
  }
  return pick([
    "Keep it on the felt. I'm watching the dice, not writing a novel.",
    "Ask me odds, come, place, field, or the point. I'll talk shop. I won't hold your hand.",
    "Shooter has the dice. You want a lesson, pick a bet and tap it. I'll tell you if it's dumb.",
  ]);
}
