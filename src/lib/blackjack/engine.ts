export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Card = { id: string; rank: Rank; suit: Suit };

const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

function randInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ?? 0) % max;
}

export function createShoe(decks = 6): Card[] {
  const cards: Card[] = [];
  let n = 0;
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: `${d}-${suit}-${rank}-${n++}`, rank, suit });
      }
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const a = cards[i]!;
    cards[i] = cards[j]!;
    cards[j] = a;
  }
  return cards;
}

export function draw(shoe: Card[]): { card: Card; shoe: Card[] } {
  const next = shoe.slice();
  const card = next.pop();
  if (!card) {
    const fresh = createShoe();
    const drawn = fresh.pop()!;
    return { card: drawn, shoe: fresh };
  }
  return { card, shoe: next };
}

export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      aces += 1;
      total += 11;
    } else if (c.rank === "K" || c.rank === "Q" || c.rank === "J" || c.rank === "10") {
      total += 10;
    } else {
      total += Number(c.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 && total <= 21 };
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function dealerShouldHit(cards: Card[]): boolean {
  const { total, soft } = handValue(cards);
  if (total < 17) return true;
  if (total === 17 && soft) return true; // H17
  return false;
}

export type Outcome = "playerBJ" | "dealerBJ" | "playerWin" | "dealerWin" | "push" | "playerBust" | "dealerBust";

export function settle(player: Card[], dealer: Card[]): Outcome {
  const p = handValue(player).total;
  const d = handValue(dealer).total;
  const pBJ = isBlackjack(player);
  const dBJ = isBlackjack(dealer);
  if (p > 21) return "playerBust";
  if (d > 21) return "dealerBust";
  if (pBJ && dBJ) return "push";
  if (pBJ) return "playerBJ";
  if (dBJ) return "dealerBJ";
  if (p > d) return "playerWin";
  if (d > p) return "dealerWin";
  return "push";
}

export function payout(outcome: Outcome, bet: number): number {
  switch (outcome) {
    case "playerBJ":
      return bet + Math.floor((bet * 3) / 2);
    case "playerWin":
    case "dealerBust":
      return bet * 2;
    case "push":
      return bet;
    default:
      return 0;
  }
}

export function outcomeLine(outcome: Outcome): string {
  switch (outcome) {
    case "playerBJ":
      return "Blackjack, sugar. Three-to-two, coming your way.";
    case "playerWin":
      return "That's a winner. Pay the player.";
    case "dealerBust":
      return "Dealer busts. Take it, doll.";
    case "push":
      return "Push. Your chips stay put.";
    case "playerBust":
      return "Bust. Too many, sweetheart.";
    case "dealerBJ":
      return "Dealer blackjack. House takes it.";
    case "dealerWin":
      return "Dealer wins. Better luck next shoe.";
  }
}
