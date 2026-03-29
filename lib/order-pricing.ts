import type { InventoryItem } from "@/types";

/** Same sale window logic as the storefront (InventoryList). */
export function getSaleMeta(item: InventoryItem) {
  if (item.sale_price == null || item.sale_price <= 0 || !item.sale_end_date) return null;
  const end = new Date(item.sale_end_date);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffMs = endDate.getTime() - startOfToday.getTime();
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return null;
  return { daysLeft };
}

export function getEffectiveUnitPriceDollars(item: InventoryItem): number {
  if (getSaleMeta(item) && item.sale_price != null && item.sale_price > 0) {
    return item.sale_price;
  }
  return item.price ?? 0;
}

export function computeOrderTotalDollars(
  lines: { cut_id: string; qty: number }[],
  inventoryByCutId: Map<string, InventoryItem>
): number {
  let sum = 0;
  for (const line of lines) {
    const inv = inventoryByCutId.get(line.cut_id);
    if (!inv) continue;
    sum += line.qty * getEffectiveUnitPriceDollars(inv);
  }
  return Math.round(sum * 100) / 100;
}
