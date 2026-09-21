import { CHIP_VALUES } from "@/lib/money";
import { cn, formatMoney } from "@/lib/utils";

const TONE: Record<number, string> = {
  1: "bg-chip-1 text-ink",
  5: "bg-chip-5 text-cream",
  25: "bg-chip-25 text-cream",
  100: "bg-chip-100 text-cream",
  500: "bg-chip-500 text-cream",
};

export function chipTone(amount: number): string {
  const denom = [...CHIP_VALUES].reverse().find((v) => amount >= v) ?? 1;
  return TONE[denom] ?? TONE[1]!;
}

export function ChipDisc({
  amount,
  selected,
  onClick,
  disabled,
}: {
  amount: number;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`${formatMoney(amount)} chip`}
      aria-pressed={selected}
      className={cn(
        "relative size-12 rounded-full font-table text-sm font-bold tracking-wide shadow-[inset_0_0_0_3px_rgba(255,255,255,0.28),inset_0_0_0_6px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-150 ease-out active:scale-[0.96]",
        chipTone(amount),
        selected && "ring-2 ring-flame ring-offset-2 ring-offset-night scale-105",
      )}
    >
      {amount}
    </button>
  );
}

export function ChipStack({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <div className="pointer-events-none mt-0.5 flex items-center gap-1">
      <span className={cn("chip-disc", chipTone(amount))} />
      <span className="font-table text-xs font-semibold tracking-wider text-cream tabular-nums">
        {formatMoney(amount)}
      </span>
    </div>
  );
}
