import { Button } from "@/components/ui/button";
import { CHIP_VALUES } from "@/lib/money";
import { useGame } from "@/lib/blackjack/store";
import { ChipDisc } from "./Chips";

export function Tray() {
  const selected = useGame((s) => s.selectedChip);
  const setChip = useGame((s) => s.setChip);
  const addChip = useGame((s) => s.addChip);
  const clearBet = useGame((s) => s.clearBet);
  const deal = useGame((s) => s.deal);
  const hit = useGame((s) => s.hit);
  const stand = useGame((s) => s.stand);
  const double = useGame((s) => s.double);
  const nextHand = useGame((s) => s.nextHand);
  const phase = useGame((s) => s.phase);
  const bet = useGame((s) => s.bet);
  const dealing = useGame((s) => s.dealing);
  const player = useGame((s) => s.player);
  const betting = phase === "betting";
  const acting = phase === "player" && !dealing;

  return (
    <div className="flex flex-col gap-2 rounded-[20px] bg-ink/75 p-3 shadow-[inset_0_0_0_1px_rgba(232,220,196,0.1)]">
      {betting ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {CHIP_VALUES.map((v) => (
              <ChipDisc
                key={v}
                amount={v}
                selected={selected === v}
                onClick={() => {
                  setChip(v);
                  addChip();
                }}
                disabled={dealing}
              />
            ))}
            <Button variant="ghost" size="sm" onClick={clearBet} disabled={bet <= 0}>
              Clear
            </Button>
          </div>
          <Button
            variant="shoot"
            size="lg"
            className="w-full tracking-[0.28em]"
            disabled={bet <= 0 || dealing}
            onClick={deal}
          >
            {dealing ? "Dealing" : "Deal"}
          </Button>
        </>
      ) : null}

      {phase === "player" ? (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="rail" size="lg" disabled={!acting} onClick={hit}>
            Hit
          </Button>
          <Button variant="shoot" size="lg" disabled={!acting} onClick={stand}>
            Stand
          </Button>
          <Button
            variant="rail"
            size="lg"
            disabled={!acting || player.length !== 2}
            onClick={double}
          >
            Double
          </Button>
        </div>
      ) : null}

      {phase === "settle" ? (
        <Button variant="shoot" size="lg" className="w-full tracking-[0.22em]" onClick={nextHand}>
          Next hand
        </Button>
      ) : null}

      {phase === "dealer" ? (
        <p className="py-2 text-center font-table text-xs tracking-[0.2em] text-muted uppercase">
          Dealer drawing
        </p>
      ) : null}
    </div>
  );
}
