"use client";

import { AddressBlock } from "./AddressBlock";

interface OrderSuccessScreenProps {
  orderId: string;
  pickupDate: string;
  pickupTimeSlot: string;
  onDismiss: () => void;
}

function formatDisplayDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  } catch {
    return isoDate;
  }
}

export function OrderSuccessScreen({
  orderId,
  pickupDate,
  pickupTimeSlot,
  onDismiss,
}: OrderSuccessScreenProps) {
  return (
    <div className="flex flex-col gap-6 rounded-lg bg-[var(--color-bg-card)] p-6 shadow-lg">
      <div className="text-center">
        <h2 className="font-header text-xl text-[var(--color-charcoal)]">Order confirmed</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Pay on arrival when you pick up.</p>
        <p className="mt-2 font-mono text-sm text-[var(--color-muted)]">{orderId}</p>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-gray-100 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Pickup</p>
        <p className="mt-1 font-medium text-[var(--color-charcoal)]">{formatDisplayDate(pickupDate)}</p>
        <p className="text-sm text-[var(--color-charcoal)]">{pickupTimeSlot}</p>
      </div>

      <AddressBlock />

      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-lg bg-[var(--color-blue)] px-4 py-2.5 font-medium text-white hover:opacity-90"
      >
        Done
      </button>
    </div>
  );
}
