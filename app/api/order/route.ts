import { NextRequest, NextResponse } from "next/server";
import {
  getInventory,
  appendActiveOrderRows,
  updateInventoryQuantities,
} from "@/lib/sheets";
import { MOCK_INVENTORY } from "@/lib/mock-data";
import type { OrderPayload, ActiveOrderRow, InventoryItem, InventoryConflict } from "@/types";

const useMock = !process.env.GOOGLE_SHEET_ID?.trim();

const MAX_NAME_LEN = 200;
const MAX_PHONE_LEN = 50;
const MAX_EMAIL_LEN = 254;

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function validatePayload(body: unknown): { data?: OrderPayload; error?: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;
  const customer_name = sanitizeString(b.customer_name, MAX_NAME_LEN);
  const phone = sanitizeString(b.phone, MAX_PHONE_LEN);
  const email = b.email !== undefined ? sanitizeString(b.email, MAX_EMAIL_LEN) : undefined;
  const pickup_date = typeof b.pickup_date === "string" ? b.pickup_date.trim().slice(0, 20) : undefined;
  const pickup_time_slot = typeof b.pickup_time_slot === "string" ? b.pickup_time_slot.trim().slice(0, 50) : undefined;

  if (!customer_name) return { error: "Customer name is required." };
  if (!phone) return { error: "Phone number is required." };

  const items = b.items;
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Order must contain at least one item." };
  }

  const validatedItems: { cut_id: string; qty: number }[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const cut_id = typeof row.cut_id === "string" ? row.cut_id.trim() : String(row.cut_id ?? "").trim();
    const qty = Number(row.qty);
    if (!cut_id || Number.isNaN(qty) || qty < 1) continue;
    validatedItems.push({ cut_id, qty: Math.floor(qty) });
  }
  if (validatedItems.length === 0) {
    return { error: "Order must contain at least one valid item." };
  }

  return {
    data: { customer_name, phone, email, items: validatedItems, pickup_date, pickup_time_slot },
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const validated = validatePayload(body);
  if (validated.error) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const { customer_name, phone, email, items, pickup_date, pickup_time_slot } = validated.data!;

  try {
    const inventory = useMock ? MOCK_INVENTORY : await getInventory();
    const inventoryByCutId = new Map<string, InventoryItem>();
    for (const inv of inventory) {
      inventoryByCutId.set(inv.cut_id, inv);
    }

    const conflicts: InventoryConflict[] = [];
    for (const item of items) {
      const inv = inventoryByCutId.get(item.cut_id);
      const available = inv ? inv.available_qty : 0;
      if (item.qty > available) {
        conflicts.push({
          cut_id: item.cut_id,
          cut_name: inv?.cut_name,
          requested: item.qty,
          available,
        });
      }
    }

    if (conflicts.length > 0) {
      const messages = conflicts.map(
        (c) =>
          `Only ${c.available} ${c.cut_name ?? c.cut_id} available (requested ${c.requested}).`
      );
      return NextResponse.json(
        {
          error:
            conflicts.length === 1
              ? messages[0]
              : "Some items exceed available inventory. Your order was adjusted.",
          details: conflicts,
        },
        { status: 409 }
      );
    }

    const order_id = `ORD-${Date.now()}`;
    const created_at = new Date().toISOString();
    const order_status = "pending";

    const rows: ActiveOrderRow[] = [];
    const decrements: Record<string, number> = {};
    for (const item of items) {
      const inv = inventoryByCutId.get(item.cut_id)!;
      rows.push({
        order_id,
        created_at,
        customer_name,
        phone,
        email: email ?? "",
        cut_id: item.cut_id,
        cut_name: inv.cut_name,
        qty: item.qty,
        unit: inv.unit,
        order_status,
        ...(pickup_date && { pickup_date }),
        ...(pickup_time_slot && { pickup_time_slot }),
      });
      decrements[item.cut_id] = (decrements[item.cut_id] ?? 0) + item.qty;
    }

    const updates: Record<string, number> = {};
    for (const [cutId, subtract] of Object.entries(decrements)) {
      const inv = inventoryByCutId.get(cutId)!;
      updates[cutId] = Math.max(0, inv.available_qty - subtract);
    }

    if (!useMock) {
      await appendActiveOrderRows(rows);
      await updateInventoryQuantities(updates);
    }

    return NextResponse.json(
      { order_id, message: "Order placed successfully." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Order submission error:", err);
    return NextResponse.json(
      { error: "Failed to process order. Please try again." },
      { status: 500 }
    );
  }
}
