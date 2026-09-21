import { useEffect, useState } from "react";
import type { Die } from "@/lib/street/cee-lo";
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

function DieView({
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
      className={cn("die-2d stoop-die", spinning && "die-tumble")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Face n={shown} />
    </div>
  );
}

export function StreetDice({
  dice,
  rolling,
}: {
  dice: [Die, Die, Die] | null;
  rolling: boolean;
}) {
  if (!dice && !rolling) return null;
  const shown = dice ?? [4, 5, 6];
  return (
    <div className="pointer-events-none absolute left-1/2 top-[54%] z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1">
      <DieView value={shown[0]!} spinning={rolling} delay={0} />
      <DieView value={shown[1]!} spinning={rolling} delay={80} />
      <DieView value={shown[2]!} spinning={rolling} delay={150} />
    </div>
  );
}

