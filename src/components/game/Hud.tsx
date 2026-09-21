import { BookOpen, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/blackjack/store";
import { formatMoney } from "@/lib/utils";

export function Hud() {
  const bankroll = useGame((s) => s.bankroll);
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const toggleRules = useGame((s) => s.toggleRules);
  const phase = useGame((s) => s.phase);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 shadow-[inset_0_0_0_1px_rgba(232,220,196,0.12)]">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-lose opacity-70" />
          <span className="relative size-2 rounded-full bg-lose" />
        </span>
        <span className="font-table text-[11px] tracking-[0.22em] text-cream uppercase">
          Live
        </span>
        <span className="text-muted">·</span>
        <span className="font-display text-sm text-cream">Lottie Lane</span>
      </div>
      <div className="pointer-events-auto flex items-center gap-2 rounded-[14px] bg-ink/70 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(232,220,196,0.12)]">
        <div className="px-2 text-right">
          <p className="font-table text-[9px] tracking-[0.16em] text-muted uppercase">
            Rail
          </p>
          <p className="text-sm font-semibold tabular-nums text-cream">
            {formatMoney(bankroll)}
          </p>
        </div>
        <p className="hidden px-2 font-table text-[10px] tracking-widest text-muted uppercase sm:block">
          {phase === "betting" ? "Place your bets" : phase}
        </p>
        <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleRules} aria-label="Rules">
          <BookOpen className="size-4" />
        </Button>
      </div>
    </header>
  );
}
