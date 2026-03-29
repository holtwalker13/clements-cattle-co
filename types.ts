/** One row from the Inventory tab */
export interface InventoryItem {
  cut_id: string;
  cut_name: string;
  category: string;
  available_qty: number;
  unit: string;
  price?: number;
  status?: string;
  /** Optional sale price for limited-time offers */
  sale_price?: number;
  /** ISO-ish date string for when sale ends (inclusive) */
  sale_end_date?: string;
   /** Descriptive fat ratio for ground beef, e.g. "80/20" */
  fat_ratio?: string;
  /** Steaks: number of steaks per pack (for display) */
  pack_count?: number;
  /** Steaks: approximate ounces per steak (for display) */
  pack_oz_each?: number;
  /** Roasts: approximate weight per roast in pounds (for display) */
  avg_wgt?: number;
  /** Minimum order qty (e.g. 10 for Ground Beef 10 lb min). First add uses this, then +1. */
  min_qty?: number;
  /** Per-pack info for display (e.g. "2–3 per pack"). */
  per_pack?: string;
}

/** Item in the user's queue/cart */
export interface QueueItem {
  cut_id: string;
  cut_name: string;
  qty: number;
  unit: string;
  price?: number;
}

/** Payload sent to POST /api/order */
export interface OrderPayload {
  customer_name: string;
  phone: string;
  email?: string;
  items: { cut_id: string; qty: number }[];
  pickup_date?: string;
  pickup_time_slot?: string;
}

/** Row written to Active Orders tab (one per line item) */
export interface ActiveOrderRow {
  order_id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  email: string;
  cut_id: string;
  cut_name: string;
  qty: number;
  unit: string;
  order_status: string;
  pickup_date?: string;
  pickup_time_slot?: string;
  /** Same total on every line of the order (for Cash App / reconciliation). */
  order_total?: number;
  /** Paste into Cash App memo so payment matches the order. */
  payment_memo?: string;
}

/** Inventory conflict when server re-validates */
export interface InventoryConflict {
  cut_id: string;
  cut_name?: string;
  requested: number;
  available: number;
}
