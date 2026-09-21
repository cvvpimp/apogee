import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US");
  if (n < 0) return `-$${formatted}`;
  return `$${formatted}`;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}
