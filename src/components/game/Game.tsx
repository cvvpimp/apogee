import { BookOpen, Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CHIP_VALUES } from "@/lib/money";
import { handShort } from "@/lib/street/cee-lo";
import { useGame } from "@/lib/street/store";
import { formatMoney } from "@/lib/utils";
import { ChipDisc } from "./Chips";
import { StreetCam } from "./StreetCam";

export function Game() {
  const seated = useGame((s) => s.seated);
  const hydrate = useGame((s) => s.hydrate);
  const sitDown = useGame((s) => s.sitDown);
  const bankroll = useGame((s) => s.bankroll);
  const nedBank = useGame((s) => s.nedBank);
  const bet = useGame((s) => s.bet);
  const selected = useGame((s) => s.selectedChip);
  const setChip = useGame((s) => s.setChip);
  const addChip = useGame((s) => s.addChip);
  const clearBet = useGame((s) => s.clearBet);
  const shoot = useGame((s) => s.shoot);
  const nextRound = useGame((s) => s.nextRound);
  const phase = useGame((s) => s.phase);
  const rolling = useGame((s) => s.rolling);
  const calHand = useGame((s) => s.calHand);
  const nedHand = useGame((s) => s.nedHand);
  const line = useGame((s) => s.line);
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const showRules = useGame((s) => s.showRules);
  const toggleRules = useGame((s) => s.toggleRules);
  const rebuy = useGame((s) => s.rebuy);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!useGame.getState().seated) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        const s = useGame.getState();
        if (s.phase === "betting") s.shoot();
        else if (s.phase === "settle") s.nextRound();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const busted = bankroll <= 0 && bet <= 0 && phase === "betting";
  const nedBusted = nedBank <= 0 && phase === "betting";

  return (
    <div className="relative h-dvh overflow-hidden bg-white text-ink">
      <div className="absolute inset-0 grid place-items-center bg-white">
        <div
          className="relative"
          style={{
            width: "min(100%, calc(100dvh * 16 / 9))",
            height: "min(100%, calc(100vw * 9 / 16))",
          }}
        >
          <StreetCam />
        </div>
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
        <div>
          <p className="font-table text-[10px] tracking-[0.28em] text-ink/45 uppercase">
            Street dice
          </p>
          <h1 className="font-display text-2xl leading-none text-ink">White Stoop</h1>
        </div>
        <div className="pointer-events-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-ink hover:bg-ink/5 hover:text-ink" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-ink hover:bg-ink/5 hover:text-ink" onClick={toggleRules} aria-label="Rules">
            <BookOpen className="size-4" />
          </Button>
        </div>
      </header>

      {seated ? (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-between px-4 text-[11px] font-table tracking-[0.16em] uppercase">
          <p>
            Cal <span className="tabular-nums">{formatMoney(bankroll)}</span>
            {calHand ? ` · ${handShort(calHand)}` : ""}
          </p>
          <p className="text-right">
            Ned <span className="tabular-nums">{formatMoney(nedBank)}</span>
            {nedHand ? ` · ${handShort(nedHand)}` : ""}
          </p>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="max-w-md text-center font-display text-lg leading-snug text-ink">
          {seated ? line : "Two shooters. Blank curb. Dice go back and forth."}
        </p>

        {!seated ? (
          <Button size="lg" className="bg-ink text-white hover:opacity-90" onClick={sitDown}>
            Step up
          </Button>
        ) : null}

        {seated && phase === "betting" ? (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CHIP_VALUES.map((v) => (
                <ChipDisc
                  key={v}
                  amount={v}
                  selected={selected === v}
                  onClick={() => {
                    setChip(v);
                    addChip();
                  }}
                  disabled={rolling}
                />
              ))}
              <Button variant="ghost" size="sm" className="text-ink hover:bg-ink/5" onClick={clearBet} disabled={bet <= 0}>
                Clear
              </Button>
            </div>
            {bet > 0 ? (
              <p className="font-table text-xs tracking-[0.2em] text-ink/50 uppercase">
                Stake {formatMoney(bet)}
              </p>
            ) : null}
            <Button
              variant="shoot"
              size="lg"
              className="min-w-44 bg-ink text-white tracking-[0.28em]"
              disabled={bet <= 0 || rolling}
              onClick={shoot}
            >
              Shoot
            </Button>
          </>
        ) : null}

        {seated && phase !== "betting" && phase !== "settle" ? (
          <p className="font-table text-[10px] tracking-[0.28em] text-ink/40 uppercase">
            {phase === "cal" ? "Cal throwing" : "Ned throwing"}
          </p>
        ) : null}

        {seated && phase === "settle" ? (
          <Button variant="shoot" size="lg" className="min-w-44 bg-ink text-white tracking-[0.22em]" onClick={nextRound}>
            Again
          </Button>
        ) : null}
      </div>

      {busted || nedBusted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 p-4">
          <div className="w-full max-w-sm rounded-[24px] border border-ink/10 bg-white p-6 text-center">
            <h2 className="font-display text-2xl">{busted ? "Cal's empty" : "Ned's empty"}</h2>
            <p className="mt-2 text-sm text-ink/60">
              Restuff both pockets and keep the curb going.
            </p>
            <Button className="mt-5 w-full bg-ink text-white" onClick={rebuy}>
              Restuff
            </Button>
          </div>
        </div>
      ) : null}

      {showRules ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={toggleRules}
        >
          <div
            className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-5 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl">Cee-lo on the stoop</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink/75">
              <p>Three dice. Cal shoots, then Ned. Junk rolls get picked up and thrown again.</p>
              <p>4-5-6 wins on the spot. 1-2-3 loses on the spot. Trips beat a point. Higher number wins the rank.</p>
              <p>You are Cal in the mustard jacket. Ned in the cap fades you.</p>
            </div>
            <Button className="mt-5 w-full bg-ink text-white" onClick={toggleRules}>
              Back to the curb
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
