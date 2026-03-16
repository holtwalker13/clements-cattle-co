"use client";

import type { InventoryItem, QueueItem } from "@/types";

interface QuantityStepperProps {
  item: InventoryItem;
  queueItem: QueueItem | undefined;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function QuantityStepper({
  item,
  queueItem,
  onIncrement,
  onDecrement,
}: QuantityStepperProps) {
  const selected = queueItem?.qty ?? 0;
  const atMax = selected >= item.available_qty;
  const isSoldOut = item.available_qty === 0;
  const canDecrement = selected > 0 && !isSoldOut;

  return (
    <div className={`flex items-center gap-1 ${isSoldOut ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={onDecrement}
        disabled={canDecrement ? false : true}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[var(--color-charcoal)] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[var(--color-blue)]/10"
      >
        <img src="/icons/minus.svg" alt="" className="h-4 w-4" aria-hidden />
      </button>
      <span className="min-w-[2rem] text-center font-medium tabular-nums text-[var(--color-charcoal)]">
        {selected}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={atMax || isSoldOut}
        aria-label="Increase quantity"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[var(--color-charcoal)] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[var(--color-blue)]/10"
      >
        <img src="/icons/plus.svg" alt="" className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
