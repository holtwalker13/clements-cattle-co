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
      style={{
        cornerShape: "squircle" as any,
        borderRadius: "30px",
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "hotpink",
      }}
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

function getSaleMeta(item: InventoryItem) {
  if (item.sale_price == null || item.sale_price <= 0 || !item.sale_end_date) return null;
  const end = new Date(item.sale_end_date);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffMs = endDate.getTime() - startOfToday.getTime();
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return null;
  let label: string;
  if (daysLeft === 0) {
    label = "Ends today";
  } else if (daysLeft === 1) {
    label = "1 day left";
  } else {
    label = `${daysLeft} days left`;
  }
  return { daysLeft, label };
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
    const aSale = getSaleMeta(a);
    const bSale = getSaleMeta(b);
    const aOnSale = !!aSale;
    const bOnSale = !!bSale;

    // 1) On-sale items first
    if (aOnSale !== bOnSale) {
      return aOnSale ? -1 : 1;
    }

    // 2) Then by category, then cut name
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.cut_name.localeCompare(b.cut_name);
  });

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((item) => {
        const queueItem = queueByCutId.get(item.cut_id);
        const isSoldOut = item.available_qty === 0;
        const saleMeta = getSaleMeta(item);
        const isOnSale = !!saleMeta;
        return (
          <li
            key={item.cut_id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 ${
              isOnSale
                ? "border-2 border-dotted border-[var(--color-blue)] bg-[var(--color-bg-card)] shadow-md"
                : "border-b-2 border-dotted border-[#efefef] bg-[var(--color-bg-card)]"
            } ${isSoldOut ? "opacity-70" : ""}`}
          >
            {isOnSale && saleMeta && (
              <div className="mb-2 flex w-full items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 font-semibold uppercase tracking-wide text-amber-900">
                  {saleMeta.label}
                </span>
                <span className="text-[var(--color-muted)]">Limited time</span>
              </div>
            )}
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
                {item.price != null && item.price > 0 && !isOnSale && (
                  <span className={isSoldOut ? "text-[var(--color-muted)]" : "font-medium text-[var(--color-charcoal)]"}>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.price)}
                    {item.unit === "lbs" ? "/lb" : "/each"}
                  </span>
                )}
                {isOnSale && (
                  <span className="flex flex-col gap-0.5">
                    <span className="text-lg font-semibold text-amber-900">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                        item.sale_price as number
                      )}
                      {item.unit === "lbs" ? "/lb" : "/each"}
                    </span>
                    {item.price != null && item.price > 0 && (
                      <span className="text-xs text-[var(--color-muted)] line-through">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.price)}
                        {item.unit === "lbs" ? "/lb" : "/each"}
                      </span>
                    )}
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
