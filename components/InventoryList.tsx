"use client";

import { useState } from "react";
import type { InventoryItem, QueueItem } from "@/types";
import { getCutIconPath, getCutIconSlug } from "@/lib/cut-icons";
import { QuantityStepper } from "./QuantityStepper";

function stockLabel(available_qty: number): string {
  if (available_qty === 0) return "Sold Out";
  if (available_qty <= 5) return "Low";
  return "";
}

function CutIcon({ item, disabled }: { item: InventoryItem; disabled?: boolean }) {
  const slug = getCutIconSlug(item);
  const path = `/icons/cuts/${slug}.svg`;
  const [failed, setFailed] = useState(false);
  const src = failed ? "/icons/cuts/default.svg" : path;

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-gray-100 text-[var(--color-charcoal)] ${
        disabled ? "opacity-50 grayscale" : ""
      }`}
    >
      <img
        key={slug}
        src={src}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function stockLabelClass(available_qty: number): string {
  if (available_qty === 0) return "bg-red-100 text-red-800";
  if (available_qty <= 5) return "bg-amber-100 text-amber-800";
  return "bg-[var(--color-blue)]/15 text-[#0284c7]";
}

interface InventoryListProps {
  inventory: InventoryItem[];
  queue: QueueItem[];
  onIncrement: (item: InventoryItem) => void;
  onDecrement: (item: InventoryItem) => void;
}

export function InventoryList({
  inventory,
  queue,
  onIncrement,
  onDecrement,
}: InventoryListProps) {
  const queueByCutId = new Map(queue.map((q) => [q.cut_id, q]));

  const sorted = [...inventory].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.cut_name.localeCompare(b.cut_name);
  });

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((item) => {
        const queueItem = queueByCutId.get(item.cut_id);
        const isSoldOut = item.available_qty === 0;
        return (
          <li
            key={item.cut_id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border-b-2 border-dotted border-[#efefef] bg-[var(--color-bg-card)] p-4 ${
              isSoldOut ? "opacity-70" : ""
            }`}
          >
            <CutIcon item={item} disabled={isSoldOut} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-medium ${isSoldOut ? "text-[var(--color-muted)]" : "text-[var(--color-charcoal)]"}`}
                >
                  {item.cut_name}
                </span>
                {stockLabel(item.available_qty) && (
                  <span
                    className={`inline rounded px-2 py-0.5 text-xs font-medium ${stockLabelClass(item.available_qty)}`}
                  >
                    {stockLabel(item.available_qty)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--color-muted)]">
                {item.price != null && item.price > 0 && (
                  <span className={isSoldOut ? "text-[var(--color-muted)]" : "font-medium text-[var(--color-charcoal)]"}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.price)}
                    {item.unit === "lbs" ? "/lb" : "/each"}
                  </span>
                )}
                {item.min_qty != null && item.min_qty > 1 && (
                  <span className="text-[var(--color-muted)]">{item.min_qty} lb min</span>
                )}
                {item.per_pack && (
                  <span className="text-[var(--color-muted)]">{item.per_pack}</span>
                )}
                <span>
                  {item.available_qty} {item.unit} available
                </span>
              </div>
            </div>
            <QuantityStepper
              item={item}
              queueItem={queueItem}
              onIncrement={() => onIncrement(item)}
              onDecrement={() => onDecrement(item)}
            />
          </li>
        );
      })}
    </ul>
  );
}
