import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PIP_CELLS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Face({ n }: { n: number }) {
  const pips = new Set(PIP_CELLS[n] ?? PIP_CELLS[1]);
  return (
    <div className="die-face">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={pips.has(i) ? "pip" : undefined} />
      ))}
    </div>
  );
}

function Die({
  value,
  spinning,
  delay,
}: {
  value: number;
  spinning: boolean;
  delay: number;
}) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!spinning) {
      setShown(value);
      return;
    }
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 70 + delay) {
        setShown(1 + Math.floor(Math.random() * 6));
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinning, value, delay]);

  return (
    <div
      className={cn("die-2d", spinning && "die-tumble")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Face n={shown} />
    </div>
  );
}

export function DicePair({
  dice,
  rolling,
}: {
  dice: [number, number] | null;
  rolling: boolean;
}) {
  const shown = dice ?? [5, 2];
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-[70%] z-20 flex -translate-x-1/2 -translate-y-1/2 gap-4",
        rolling && "drop-shadow-lg",
      )}
    >
      <Die value={shown[0] ?? 5} spinning={rolling} delay={0} />
      <Die value={shown[1] ?? 2} spinning={rolling} delay={90} />
    </div>
  );
}
