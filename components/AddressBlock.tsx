"use client";

const DEFAULT_ADDRESS = "123 Farm Road, Green Valley, CA 94000";
const PULL_UP_INSTRUCTIONS = "Go past the barn by the blue sign.";

interface AddressBlockProps {
  address?: string;
  pullUpInstructions?: string;
  className?: string;
}

export function AddressBlock({
  address = DEFAULT_ADDRESS,
  pullUpInstructions = PULL_UP_INSTRUCTIONS,
  className = "",
}: AddressBlockProps) {
  return (
    <div className={`rounded-lg border border-[var(--color-border)] bg-gray-100 p-4 ${className}`}>
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue)]/20 text-[var(--color-charcoal)]">
          <img src="/icons/map-pin.svg" alt="" className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[var(--color-charcoal)]">Pickup location</p>
          <p className="mt-0.5 text-sm text-[var(--color-charcoal)]">{address}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Pull up instructions
          </p>
          <p className="mt-0.5 text-sm italic text-[var(--color-muted)]">{pullUpInstructions}</p>
        </div>
      </div>
    </div>
  );
}
