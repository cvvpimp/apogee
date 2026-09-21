export type Die = 1 | 2 | 3 | 4 | 5 | 6;
export type Dice = [Die, Die, Die];

export type Hand =
  | { kind: "seeLo" }
  | { kind: "aceDeuce" }
  | { kind: "trips"; n: Die }
  | { kind: "point"; n: Die }
  | { kind: "junk" };

function randDie(): Die {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return ((buf[0]! % 6) + 1) as Die;
}

export function rollDice(): Dice {
  return [randDie(), randDie(), randDie()];
}

export function readHand(dice: Dice): Hand {
  const s = [...dice].sort((a, b) => a - b) as Dice;
  if (s[0] === 4 && s[1] === 5 && s[2] === 6) return { kind: "seeLo" };
  if (s[0] === 1 && s[1] === 2 && s[2] === 3) return { kind: "aceDeuce" };
  if (s[0] === s[1] && s[1] === s[2]) return { kind: "trips", n: s[0] };
  if (s[0] === s[1]) return { kind: "point", n: s[2] };
  if (s[1] === s[2]) return { kind: "point", n: s[0] };
  return { kind: "junk" };
}

export function rank(hand: Hand): number {
  switch (hand.kind) {
    case "junk":
      return 0;
    case "aceDeuce":
      return 1;
    case "point":
      return 10 + hand.n;
    case "trips":
      return 20 + hand.n;
    case "seeLo":
      return 40;
  }
}

export function compare(a: Hand, b: Hand): "a" | "b" | "push" {
  const ra = rank(a);
  const rb = rank(b);
  if (ra > rb) return "a";
  if (rb > ra) return "b";
  return "push";
}

export function handLine(who: "Cal" | "Ned", hand: Hand): string {
  switch (hand.kind) {
    case "seeLo":
      return `${who} hits 4-5-6. That's the window.`;
    case "aceDeuce":
      return `${who} rolls 1-2-3. Dead on the curb.`;
    case "trips":
      return `${who} trips ${hand.n}s.`;
    case "point":
      return `${who} shows a ${hand.n}.`;
    case "junk":
      return `${who} got nothing. Pick 'em up.`;
  }
}

export function handShort(hand: Hand): string {
  switch (hand.kind) {
    case "seeLo":
      return "4-5-6";
    case "aceDeuce":
      return "1-2-3";
    case "trips":
      return `trips ${hand.n}`;
    case "point":
      return `point ${hand.n}`;
    case "junk":
      return "nothing";
  }
}
