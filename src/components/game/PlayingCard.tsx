import type { Card } from "@/lib/blackjack/engine";
import { cn } from "@/lib/utils";

const SUIT: Record<Card["suit"], string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

export function PlayingCard({
  card,
  hidden,
  delay = 0,
}: {
  card?: Card;
  hidden?: boolean;
  delay?: number;
}) {
  const red = card?.suit === "hearts" || card?.suit === "diamonds";
  return (
    <div
      className={cn(
        "playing-card relative h-[4.6rem] w-[3.2rem] shrink-0 rounded-[8px] sm:h-[5.4rem] sm:w-[3.75rem]",
        hidden ? "playing-card-back" : "bg-cream",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {hidden || !card ? (
        <span className="sr-only">Facedown card</span>
      ) : (
        <div
          className={cn(
            "flex h-full flex-col justify-between p-1.5 font-table leading-none",
            red ? "text-chip-5" : "text-ink",
          )}
        >
          <span className="text-sm font-bold sm:text-base">{card.rank}</span>
          <span className="self-end text-lg sm:text-xl">{SUIT[card.suit]}</span>
        </div>
      )}
    </div>
  );
}
