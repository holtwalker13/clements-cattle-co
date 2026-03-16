"use client";

import { useState, useMemo } from "react";
import { AddressBlock } from "./AddressBlock";

/** 1hr windows from 9am to 7pm */
const TIME_SLOTS = [
  "9:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM",
  "1:00 PM – 2:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
  "6:00 PM – 7:00 PM",
];

export interface PickupChoice {
  pickup_date: string;
  pickup_time_slot: string;
}

interface PickupStepProps {
  onConfirm: (choice: PickupChoice) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMinDate(): string {
  const d = new Date();
  return toDateInputValue(d);
}

export function PickupStep({
  onConfirm,
  onBack,
  isSubmitting = false,
  error = null,
}: PickupStepProps) {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const minDate = useMemo(getMinDate, []);

  const canSubmit = date && timeSlot && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({ pickup_date: date, pickup_time_slot: timeSlot });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="pickup_date" className="mb-1 block text-sm font-medium text-[var(--color-charcoal)]">
          Pickup date *
        </label>
        <input
          id="pickup_date"
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-[var(--color-charcoal)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[var(--color-charcoal)]">Pickup time (1-hour window) *</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setTimeSlot(slot)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                timeSlot === slot
                  ? "border-[var(--color-blue)] bg-[var(--color-blue)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-charcoal)] hover:border-[var(--color-blue)] hover:bg-[var(--color-blue)]/10"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <AddressBlock />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-blue)]/10"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-[var(--color-blue)] px-4 py-2.5 font-medium text-white disabled:opacity-50 hover:opacity-90"
        >
          {isSubmitting ? "Placing order…" : "Place order · Pay on arrival"}
        </button>
      </div>
    </form>
  );
}
