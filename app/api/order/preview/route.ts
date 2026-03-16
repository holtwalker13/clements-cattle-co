import { NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/sheets";
import { MOCK_INVENTORY } from "@/lib/mock-data";
import type { InventoryConflict } from "@/types";

const useMock = !process.env.GOOGLE_SHEET_ID?.trim();

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray((body as Record<string, unknown>).items)
    ? (body as { items: { cut_id: string; qty: number }[] }).items
    : [];
  if (items.length === 0) {
    return NextResponse.json({ valid: true, conflicts: [] });
  }

  try {
    const inventory = useMock ? MOCK_INVENTORY : await getInventory();
    const byCutId = new Map(inventory.map((inv) => [inv.cut_id, inv]));
    const conflicts: InventoryConflict[] = [];
    for (const item of items) {
      const inv = byCutId.get(item.cut_id);
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
    return NextResponse.json({
      valid: conflicts.length === 0,
      conflicts,
    });
  } catch {
    return NextResponse.json(
      { error: "Inventory is temporarily unavailable." },
      { status: 503 }
    );
  }
}
