"use client";

import { useState } from "react";
import { AddressBlock } from "./AddressBlock";
import { buildCashAppPayUrl, getCashAppCashtag } from "@/lib/cashapp";

interface OrderSuccessScreenProps {
  orderId: string;
  pickupDate: string;
  pickupTimeSlot: string;
  orderTotal: number;
  paymentMemo: string;
  cashAppUrl: string;
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

function formatMoney(d: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(d);
}

export function OrderSuccessScreen({
  orderId,
  pickupDate,
  pickupTimeSlot,
  orderTotal,
  paymentMemo,
  cashAppUrl,
  onDismiss,
}: OrderSuccessScreenProps) {
  const [copied, setCopied] = useState(false);
  const cashtag = getCashAppCashtag();
  const payUrl = cashAppUrl || (orderTotal > 0 ? buildCashAppPayUrl(orderTotal) : "");

  const copyMemo = async () => {
    try {
      await navigator.clipboard.writeText(paymentMemo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-[var(--color-bg-card)] p-6 shadow-lg">
      <div className="text-center">
        <h2 className="font-header text-xl text-[var(--color-charcoal)]">Order confirmed</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Pay now with Cash App using the amount below. Paste the memo in Cash App so we can match your payment.
        </p>
        <p className="mt-2 font-mono text-sm text-[var(--color-muted)]">{orderId}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--color-charcoal)]">
          {formatMoney(orderTotal)}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-gray-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Cash App</p>
        <p className="mt-1 text-sm text-[var(--color-charcoal)]">
          Send to <span className="font-semibold">${cashtag}</span>
        </p>
        <a
          href={payUrl || "https://cash.app"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center rounded-lg bg-[#00d632] px-4 py-3 text-center text-sm font-semibold text-black hover:opacity-90"
        >
          Open Cash App · {formatMoney(orderTotal)}
        </a>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          If the amount is correct but the note is empty, paste the memo below before you send.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Memo (paste in Cash App)</p>
        <p className="mt-2 break-words font-mono text-xs text-[var(--color-charcoal)]">{paymentMemo}</p>
        <button
          type="button"
          onClick={copyMemo}
          className="mt-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-sm font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-blue)]/10"
        >
          {copied ? "Copied" : "Copy memo"}
        </button>
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
