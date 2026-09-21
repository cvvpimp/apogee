import type { BetKind } from "@/lib/craps/types";
import { useGame } from "@/lib/craps/store";
import { amountOn } from "@/lib/craps/payouts";
import { cn } from "@/lib/utils";
import { ChipStack } from "./Chips";

export function BetSpot({
  label,
  sub,
  kind,
  number,
  payoff,
  area,
  className,
}: {
  label: string;
  sub?: string;
  kind: BetKind;
  number?: number;
  payoff?: string;
  area: string;
  className?: string;
}) {
  const rolling = useGame((s) => s.rolling);
  const takeMode = useGame((s) => s.takeMode);
  const tapSpot = useGame((s) => s.tapSpot);
  const amount = useGame((s) => amountOn(s.bets, kind, number));

  return (
    <button
      type="button"
      disabled={rolling}
      onClick={() => tapSpot(kind, number)}
      className={cn("spot", area, amount > 0 && "spot-active", className)}
      aria-label={`${takeMode ? "Take" : "Bet"} ${label}${payoff ? ` ${payoff}` : ""}`}
    >
      <span className="text-[11px] font-semibold leading-none sm:text-xs">{label}</span>
      {sub ? (
        <span className="text-[9px] tracking-widest text-line/70">{sub}</span>
      ) : null}
      {payoff ? (
        <span className="text-[9px] text-line/60">{payoff}</span>
      ) : null}
      <ChipStack amount={amount} />
    </button>
  );
}

export function NumberBox({ n }: { n: 4 | 5 | 6 | 8 | 9 | 10 }) {
  const rolling = useGame((s) => s.rolling);
  const point = useGame((s) => s.point);
  const tapSpot = useGame((s) => s.tapSpot);
  const place = useGame((s) => amountOn(s.bets, "place", n));
  const come = useGame((s) =>
    s.bets
      .filter((b) => b.kind === "come" && b.number === n)
      .reduce((s, b) => s + b.amount, 0),
  );
  const comeOdds = useGame((s) => amountOn(s.bets, "comeOdds", n));
  const isPoint = point === n;

  return (
    <div
      className={cn(
        "spot area-n" + n,
        "min-h-[56px] justify-start gap-0.5 py-1.5",
        (place > 0 || come > 0) && "spot-active",
        isPoint && "spot-point",
      )}
    >
      {isPoint ? (
        <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-puck-on text-[8px] font-bold tracking-widest text-ink">
          ON
        </span>
      ) : null}
      <button
        type="button"
        disabled={rolling}
        onClick={() => tapSpot("place", n)}
        className="flex w-full flex-col items-center"
        aria-label={`Place ${n}`}
      >
        <span className="text-lg font-semibold leading-none sm:text-xl">{n}</span>
        <ChipStack amount={place} />
      </button>
      {come > 0 ? (
        <button
          type="button"
          disabled={rolling}
          onClick={() => tapSpot("comeOdds", n)}
          className="w-full rounded-[6px] border border-line/25 bg-felt-deep/50 px-1 py-0.5"
          aria-label={`Come odds on ${n}`}
        >
          <span className="text-[9px] text-line/70">Come</span>
          <ChipStack amount={come + comeOdds} />
        </button>
      ) : null}
    </div>
  );
}
