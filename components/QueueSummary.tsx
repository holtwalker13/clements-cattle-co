"use client";

import type { QueueItem } from "@/types";

interface QueueSummaryProps {
  items: QueueItem[];
  onClear: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

function formatTotal(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents);
}

export function QueueSummary({
  items,
  onClear,
  onSubmit,
  isSubmitting = false,
}: QueueSummaryProps) {
  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalAmount = items.reduce((sum, i) => sum + (i.qty * (i.price ?? 0)), 0);
  const isEmpty = items.length === 0;
  const submitLabel =
    isEmpty || isSubmitting
      ? isSubmitting
        ? "Submitting…"
        : "Submit order"
      : totalAmount > 0
        ? `Submit order · ${formatTotal(totalAmount)}`
        : "Submit order";

  return (
    <div className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="font-header text-[var(--color-charcoal)]">Your order</h2>
        <p className="text-sm text-[var(--color-muted)]">
          {totalCount} item{totalCount !== 1 ? "s" : ""} in queue
          {totalAmount > 0 && ` · ${formatTotal(totalAmount)}`}
        </p>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        {isEmpty ? (
          <p className="text-sm text-[var(--color-muted)]">No items yet. Use + to add.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.cut_id}
                className="flex justify-between text-sm"
              >
                <span className="text-[var(--color-charcoal)]">{item.cut_name}</span>
                <span className="tabular-nums text-[var(--color-muted)]">
                  {item.qty} {item.unit}
                  {item.price != null && item.price > 0 && (
                    <span className="ml-1">
                      · {formatTotal(item.qty * item.price)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] p-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isEmpty || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
        >
          <img src="/icons/cart.svg" alt="" className="h-5 w-5 [filter:invert(1)]" aria-hidden />
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={isEmpty}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 font-medium text-[var(--color-charcoal)] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[var(--color-blue)]/10"
        >
          <img src="/icons/trash.svg" alt="" className="h-4 w-4" aria-hidden />
          Clear queue
        </button>
      </div>
    </div>
  );
}
