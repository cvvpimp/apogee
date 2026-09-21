import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/blackjack/store";

export function StartScreen() {
  const sitDown = useGame((s) => s.sitDown);

  return (
    <div className="relative flex min-h-dvh flex-col justify-end overflow-hidden bg-ink">
      <video
        className="absolute inset-0 size-full object-cover"
        src="/dealer/idle.mp4"
        poster="/dealer/poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-5 px-5 pb-12 pt-24">
        <p className="font-table text-xs tracking-[0.28em] text-line uppercase">
          Live dealer · The Midnight Line
        </p>
        <h1 className="font-display text-5xl leading-[0.95] text-cream sm:text-6xl">
          Lottie Live
        </h1>
        <p className="max-w-md text-pretty text-base leading-relaxed text-cream/85">
          Camera on the dealer. She shuffles, she deals, she talks. Blackjack
          across a 1930s cartoon pit — an original flapper named Lottie Lane,
          not a licensed cartoon.
        </p>
        <ul className="space-y-1 text-sm text-muted">
          <li>Drop a chip. Lottie shuffles on camera.</li>
          <li>Hit, stand, or double. Naturals pay 3:2.</li>
          <li>Ask her anything. She's on the stick.</li>
        </ul>
        <Button size="lg" onClick={sitDown} className="w-full sm:w-auto">
          Sit at the table
        </Button>
      </div>
    </div>
  );
}
