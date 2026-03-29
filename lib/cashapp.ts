/**
 * Cash App “Pay” links for a $cashtag + amount.
 *
 * Notes:
 * - Standard consumer Cash App P2P has no webhook or API to confirm payment to a third-party app.
 *   Automatic “mark paid” in Google Sheets is not possible with only a personal/business $cashtag.
 * - Cash App Pay (merchant SDK) is a separate product and requires Cash App partnership.
 * - Practical options: reconcile manually in Sheets, or use Stripe/Square if you need webhooks.
 *
 * Memo cannot be reliably prefilled via URL; we show copy-paste text and open Cash App with amount.
 */

const MEMO_MAX = 200;

export function getCashAppCashtag(): string {
  const raw = process.env.NEXT_PUBLIC_CASHAPP_CASHTAG?.trim() || "ClemCattleCo";
  return raw.replace(/^@/, "");
}

/** Dollars with at most 2 decimal places for URL stability. */
export function formatCashAppAmount(dollars: number): string {
  const n = Math.round(dollars * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * https://cash.app/$Cashtag/amount — opens send flow with recipient + amount (note: memo not in URL).
 */
export function buildCashAppPayUrl(dollars: number): string {
  const tag = getCashAppCashtag();
  const amount = formatCashAppAmount(dollars);
  return `https://cash.app/$${encodeURIComponent(tag)}/${amount}`;
}

export function buildPaymentMemo(
  orderId: string,
  lines: { cut_name: string; qty: number; unit: string }[]
): string {
  const unitSuffix = (u: string) => {
    if (u === "lbs") return "lb";
    if (u === "pkgs") return "pkg";
    if (u === "slabs") return "slab";
    return "";
  };
  const parts = lines.map((l) => {
    const name = l.cut_name.length > 18 ? `${l.cut_name.slice(0, 17)}…` : l.cut_name;
    const suf = unitSuffix(l.unit);
    return suf ? `${name} ${l.qty}${suf}` : `${name} x${l.qty}`;
  });
  let body = parts.join(", ");
  const prefix = `${orderId} · `;
  if (prefix.length + body.length <= MEMO_MAX) {
    return prefix + body;
  }
  body = body.slice(0, Math.max(0, MEMO_MAX - prefix.length - 3)) + "…";
  return prefix + body;
}
