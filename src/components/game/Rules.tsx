import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/blackjack/store";

export function Rules() {
  const open = useGame((s) => s.showRules);
  const toggle = useGame((s) => s.toggleRules);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
      onClick={toggle}
    >
      <div
        className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-rail p-5 text-cream shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="rules-title" className="font-display text-2xl">
          Lottie's house
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-cream/85">
          <p>
            Live blackjack. Six-deck shoe. Lottie hits a soft 17. Blackjack pays
            three-to-two. Push returns your bet. No insurance, no splits — keep
            it clean for the camera.
          </p>
          <p>
            Tap a chip to bet, then Deal. She shuffles on a new shoe. Hit, stand,
            or double on your first two cards.
          </p>
          <p>
            Tap her line to talk. She's an original 1930s cartoon dealer —
            not a licensed character.
          </p>
        </div>
        <Button className="mt-5 w-full" onClick={toggle}>
          Back to the camera
        </Button>
      </div>
    </div>
  );
}
