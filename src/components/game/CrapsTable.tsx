import { useGame } from "@/lib/craps/store";
import { amountOn } from "@/lib/craps/payouts";
import { cn } from "@/lib/utils";
import { BetSpot, NumberBox } from "./BetSpot";
import { ChipStack } from "./Chips";
import { DicePair } from "./Dice";

export function CrapsTable() {
  const rolling = useGame((s) => s.rolling);
  const phase = useGame((s) => s.phase);
  const dice = useGame((s) => s.pendingDice ?? s.dice);
  const tapSpot = useGame((s) => s.tapSpot);
  const pass = useGame((s) => amountOn(s.bets, "pass"));
  const passOdds = useGame((s) => amountOn(s.bets, "passOdds"));
  const dont = useGame((s) => amountOn(s.bets, "dontPass"));
  const dontOdds = useGame((s) => amountOn(s.bets, "dontPassOdds"));
  const come = useGame((s) =>
    s.bets.filter((b) => b.kind === "come" && b.number == null).reduce((n, b) => n + b.amount, 0),
  );
  const dc = useGame((s) =>
    s.bets
      .filter((b) => b.kind === "dontCome" && b.number == null)
      .reduce((n, b) => n + b.amount, 0),
  );

  return (
    <div className="rail-frame relative overflow-hidden rounded-[28px] p-2 sm:p-3">
      <div className="felt-surface relative overflow-hidden rounded-[20px] p-2 sm:p-3">
        <div className="craps-grid relative z-10">
          <BetSpot area="area-h4" kind="hard" number={4} label="Hard 4" payoff="7:1" />
          <BetSpot area="area-h6" kind="hard" number={6} label="Hard 6" payoff="9:1" />
          <BetSpot area="area-h8" kind="hard" number={8} label="Hard 8" payoff="9:1" />
          <BetSpot area="area-h10" kind="hard" number={10} label="Hard 10" payoff="7:1" />

          <BetSpot area="area-aces" kind="aces" label="2" payoff="30:1" />
          <BetSpot area="area-aceD" kind="aceDeuce" label="3" payoff="15:1" />
          <BetSpot area="area-yo" kind="yo" label="11" payoff="15:1" />
          <BetSpot area="area-box" kind="boxcars" label="12" payoff="30:1" />
          <BetSpot area="area-any7" kind="any7" label="Any 7" payoff="4:1" />
          <BetSpot area="area-craps" kind="anyCraps" label="Craps" payoff="7:1" />
          <BetSpot area="area-ce" kind="ce" label="C & E" payoff="3:1 / 7:1" />

          <button
            type="button"
            disabled={rolling}
            onClick={() => tapSpot("dontCome")}
            className={cn("spot area-dc min-h-[56px]", dc > 0 && "spot-active")}
            aria-label="Don't Come"
          >
            <span className="text-[11px] font-semibold leading-tight sm:text-xs">
              Don't Come
            </span>
            {phase === "comeOut" ? (
              <span className="mt-1 grid size-7 place-items-center rounded-full bg-puck-off text-[8px] font-bold tracking-widest text-cream">
                OFF
              </span>
            ) : null}
            <ChipStack amount={dc} />
          </button>

          <NumberBox n={4} />
          <NumberBox n={5} />
          <NumberBox n={6} />
          <NumberBox n={8} />
          <NumberBox n={9} />
          <NumberBox n={10} />

          <button
            type="button"
            disabled={rolling}
            onClick={() => tapSpot("come")}
            className={cn("spot area-come min-h-[56px]", come > 0 && "spot-active")}
            aria-label="Come"
          >
            <span className="text-sm font-semibold sm:text-base">Come</span>
            <ChipStack amount={come} />
          </button>

          <BetSpot area="area-b6" kind="big6" label="Big 6" payoff="1:1" className="min-h-[64px]" />
          <BetSpot
            area="area-field"
            kind="field"
            label="Field"
            sub="2 3 4 9 10 11 12"
            payoff="2 & 12 pay double"
            className="min-h-[48px]"
          />
          <BetSpot area="area-b8" kind="big8" label="Big 8" payoff="1:1" className="min-h-[64px]" />

          <button
            type="button"
            disabled={rolling}
            onClick={() => tapSpot("dontPass")}
            className={cn("spot area-dp min-h-[44px]", dont + dontOdds > 0 && "spot-active")}
            aria-label="Don't Pass"
          >
            <span className="text-xs font-semibold sm:text-sm">
              Don't Pass Bar · 12
            </span>
            <ChipStack amount={dont + dontOdds} />
          </button>

          <button
            type="button"
            disabled={rolling}
            onClick={() => tapSpot("pass")}
            className={cn(
              "spot area-pass min-h-[48px]",
              pass + passOdds > 0 && "spot-active",
            )}
            aria-label={phase === "point" ? "Pass odds" : "Pass line"}
          >
            <span className="text-sm font-semibold tracking-[0.18em] sm:text-base">
              Pass Line
            </span>
            {phase === "point" ? (
              <span className="text-[9px] tracking-widest text-line/70">
                Odds open · 3-4-5x
              </span>
            ) : (
              <span className="text-[9px] tracking-widest text-line/70">
                Come-out · 7 or 11
              </span>
            )}
            <ChipStack amount={pass + passOdds} />
          </button>
        </div>

        <DicePair dice={dice} rolling={rolling} />
      </div>
    </div>
  );
}
