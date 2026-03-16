import type { InventoryItem } from "@/types";

/** Dummy inventory from price list: Individual Cuts. */
export const MOCK_INVENTORY: InventoryItem[] = [
  { cut_id: "101", cut_name: "Ground Beef", category: "Individual Cuts", available_qty: 40, unit: "lbs", price: 6, min_qty: 10 },
  { cut_id: "102", cut_name: "Round Steak", category: "Individual Cuts", available_qty: 12, unit: "lbs", price: 7 },
  { cut_id: "103", cut_name: "Sirloin Steak", category: "Individual Cuts", available_qty: 10, unit: "lbs", price: 13 },
  { cut_id: "104", cut_name: "Porterhouse Steak", category: "Individual Cuts", available_qty: 0, unit: "lbs", price: 13 },
  {
    cut_id: "105",
    cut_name: "T-Bone Steak",
    category: "Individual Cuts",
    available_qty: 8,
    unit: "lbs",
    price: 13,
    per_pack: "2–3 per pack",
    sale_price: 10,
    sale_end_date: "2026-03-20",
  },
  { cut_id: "106", cut_name: "Ribeye Steak", category: "Individual Cuts", available_qty: 6, unit: "lbs", price: 18, per_pack: "2 per pack" },
  { cut_id: "107", cut_name: "Roasts", category: "Individual Cuts", available_qty: 15, unit: "lbs", price: 10 },
  { cut_id: "108", cut_name: "New York Strip", category: "Individual Cuts", available_qty: 8, unit: "lbs", price: 17 },
  { cut_id: "109", cut_name: "Filet Mignon", category: "Individual Cuts", available_qty: 5, unit: "lbs", price: 22 },
];
