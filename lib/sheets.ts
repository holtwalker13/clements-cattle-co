import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import type { InventoryItem, ActiveOrderRow } from "@/types";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const INVENTORY_TAB_NAME = "Inventory";
const ACTIVE_ORDERS_TAB_NAME = "Active Orders";

function getDoc() {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error(
      "Missing Google Sheets env: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY"
    );
  }
  const auth = new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return new GoogleSpreadsheet(SHEET_ID, auth);
}

function parseNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim().replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/**
 * Load and return all inventory rows. Skips blank rows and normalizes available_qty to number.
 */
export async function getInventory(): Promise<InventoryItem[]> {
  const doc = getDoc();
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[INVENTORY_TAB_NAME];
  if (!sheet) {
    throw new Error(`Sheet tab "${INVENTORY_TAB_NAME}" not found`);
  }
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();
  const result: InventoryItem[] = [];
  for (const row of rows) {
    const cutId = String(row.get("cut_id") ?? "").trim();
    if (!cutId) continue; // skip blank rows
    const cutName = String(row.get("cut_name") ?? "").trim();
    const category = String(row.get("category") ?? "").trim();
    const availableQty = parseNumber(row.get("available_qty"));
    const unit = String(row.get("unit") ?? "").trim();
    const priceRaw = row.get("price");
    const price = priceRaw !== undefined && priceRaw !== "" ? parseNumber(priceRaw) : undefined;
    const status = String(row.get("status") ?? "").trim() || undefined;
    result.push({
      cut_id: cutId,
      cut_name: cutName || cutId,
      category: category || "Other",
      available_qty: availableQty,
      unit: unit || "each",
      price,
      status,
    });
  }
  return result;
}

/**
 * Append order line rows to the Active Orders tab. One row per line item.
 */
export async function appendActiveOrderRows(rows: ActiveOrderRow[]): Promise<void> {
  if (rows.length === 0) return;
  const doc = getDoc();
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[ACTIVE_ORDERS_TAB_NAME];
  if (!sheet) {
    throw new Error(`Sheet tab "${ACTIVE_ORDERS_TAB_NAME}" not found`);
  }
  await sheet.loadHeaderRow();
  await sheet.addRows(rows as unknown as Record<string, string | number>[]);
}

/**
 * Update available_qty in the Inventory tab for given cut_ids.
 * updates: map of cut_id -> new available_qty (after decrement).
 */
export async function updateInventoryQuantities(
  updates: Record<string, number>
): Promise<void> {
  if (Object.keys(updates).length === 0) return;
  const doc = getDoc();
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[INVENTORY_TAB_NAME];
  if (!sheet) {
    throw new Error(`Sheet tab "${INVENTORY_TAB_NAME}" not found`);
  }
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();
  for (const row of rows) {
    const cutId = String(row.get("cut_id") ?? "").trim();
    if (cutId && updates[cutId] !== undefined) {
      row.set("available_qty", updates[cutId]);
      await row.save();
    }
  }
}
