import { NextResponse } from "next/server";
import { getInventory } from "@/lib/sheets";
import { MOCK_INVENTORY } from "@/lib/mock-data";

const useMock = !process.env.GOOGLE_SHEET_ID?.trim();

export async function GET() {
  if (useMock) {
    return NextResponse.json(MOCK_INVENTORY, {
      headers: { "X-Mock-Mode": "true" },
    });
  }
  try {
    const inventory = await getInventory();
    return NextResponse.json(inventory);
  } catch (err) {
    return NextResponse.json(
      { error: "Inventory is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
