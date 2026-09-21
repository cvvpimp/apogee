import { BookOpen, Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { CrashCanvas } from "@/components/game/CrashCanvas";
import { ChipDisc } from "@/components/game/Chips";
import { Button } from "@/components/ui/button";
import { formatMult } from "@/lib/crash/engine";
import { useGame } from "@/lib/crash/store";
import { CHIP_VALUES, STARTING_BANKROLL } from "@/lib/money";
import { formatMoney } from "@/lib/utils";

function histTone(n: number): string {
  if (n < 1.5) return "text-flame";
  if (n >= 10) return "text-flame";
  return "text-cream/80";
}

export function Game() {
  const hydrate = useGame((s) => s.hydrate);
  const bankroll = useGame((s) => s.bankroll);
  const bet = useGame((s) => s.bet);
  const selected = useGame((s) => s.selectedChip);
  const setChip = useGame((s) => s.setChip);
  const addChip = useGame((s) => s.addChip);
  const clearBet = useGame((s) => s.clearBet);
  const launch = useGame((s) => s.launch);
  const cashOut = useGame((s) => s.cashOut);
  const nextRound = useGame((s) => s.nextRound);
  const phase = useGame((s) => s.phase);
  const multiplier = useGame((s) => s.multiplier);
  const cashedAt = useGame((s) => s.cashedAt);
  const history = useGame((s) => s.history);
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
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code !== "Space") return;
      e.preventDefault();
      const s = useGame.getState();
      if (s.phase === "betting") s.launch();
      else if (s.phase === "flying") s.cashOut();
      else s.nextRound();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const busted = bankroll <= 0 && bet <= 0 && phase === "betting";
  const flying = phase === "flying";
  const canCash = flying && cashedAt === null && bet > 0;

  return (
    <div className="relative h-dvh overflow-hidden bg-night text-cream">
      <CrashCanvas />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
        <div>
          <p className="font-table text-[10px] tracking-[0.32em] text-steel uppercase">Crash</p>
          <h1 className="font-display text-2xl leading-none tracking-tight">Apogee</h1>
        </div>
        <div className="pointer-events-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-cream hover:bg-cream/5 hover:text-cream"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-cream hover:bg-cream/5 hover:text-cream"
            onClick={toggleRules}
            aria-label="Rules"
          >
            <BookOpen className="size-4" />
          </Button>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-between px-4 font-table text-[11px] tracking-[0.18em] uppercase text-steel">
        <p>
          Bank <span className="text-cream tabular-nums">{formatMoney(bankroll)}</span>
        </p>
        <p className="flex flex-wrap justify-end gap-2">
          {history.map((n, i) => (
            <span key={`${n}-${i}`} className={histTone(n)}>
              {formatMult(n)}
            </span>
          ))}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[28%] z-10 flex flex-col items-center">
        <p
          className={`font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl ${
            phase === "crashed" && !cashedAt ? "text-flame" : "text-cream"
          }`}
        >
          {formatMult(multiplier)}
        </p>
        {cashedAt && phase !== "betting" ? (
          <p className="mt-1 font-table text-xs tracking-[0.22em] text-flame uppercase">
            Cashed {formatMult(cashedAt)}
          </p>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="max-w-md text-center font-display text-lg leading-snug text-cream">{line}</p>

        {phase === "betting" ? (
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
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-cream hover:bg-cream/5 hover:text-cream"
                onClick={clearBet}
                disabled={bet <= 0}
              >
                Clear
              </Button>
            </div>
            {bet > 0 ? (
              <p className="font-table text-xs tracking-[0.2em] text-steel uppercase">
                Stake {formatMoney(bet)}
              </p>
            ) : null}
            <Button
              size="lg"
              className="min-w-44 bg-flame text-night hover:opacity-90"
              disabled={bet <= 0}
              onClick={launch}
            >
              Launch
            </Button>
          </>
        ) : null}

        {flying ? (
          <Button
            size="lg"
            className="min-w-44 bg-flame text-night hover:opacity-90"
            disabled={!canCash}
            onClick={cashOut}
          >
            {canCash ? "Cash out" : "Riding"}
          </Button>
        ) : null}

        {phase === "crashed" ? (
          <Button size="lg" className="min-w-44 bg-cream text-night hover:opacity-90" onClick={nextRound}>
            Next round
          </Button>
        ) : null}
      </div>

      {busted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4">
          <div className="w-full max-w-sm rounded-[24px] border border-cream/10 bg-night p-6 text-center">
            <h2 className="font-display text-2xl">Empty tanks</h2>
            <p className="mt-2 text-sm text-steel">Restuff and try the climb again.</p>
            <Button className="mt-5 w-full bg-flame text-night" onClick={rebuy}>
              Restuff {formatMoney(STARTING_BANKROLL)}
            </Button>
          </div>
        </div>
      ) : null}

      {showRules ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/60 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={toggleRules}
        >
          <div
            className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-night p-5 text-cream shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-cream/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl">How it crashes</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-cream/75">
              <p>Stake chips, hit Launch. The rocket climbs and the multiplier goes with it.</p>
              <p>Cash out any time. You take stake × the live multiplier. Wait too long and it blows — stake is gone.</p>
              <p>Space bar launches, cashes, or starts the next round. Instant 1.00x happens. That’s the house.</p>
            </div>
            <Button className="mt-5 w-full bg-flame text-night" onClick={toggleRules}>
              Got it
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
