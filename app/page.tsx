"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { InventoryItem, QueueItem } from "@/types";
import { InventoryList } from "@/components/InventoryList";
import { QueueSummary } from "@/components/QueueSummary";
import { CustomerForm, type CustomerFormData } from "@/components/CustomerForm";
import { PickupStep, type PickupChoice } from "@/components/PickupStep";
import { OrderSuccessScreen } from "@/components/OrderSuccessScreen";
import { getCutIconSlug } from "@/lib/cut-icons";

function formatTotal(dollars: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dollars);
}

export default function Home() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"customer" | "pickup">("customer");
  const [customerData, setCustomerData] = useState<CustomerFormData | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    orderId: string;
    pickupDate: string;
    pickupTimeSlot: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [showMobileQueueDetails, setShowMobileQueueDetails] = useState(false);

  const totalAmount = useMemo(
    () => queue.reduce((sum, i) => sum + i.qty * (i.price ?? 0), 0),
    [queue]
  );

  const fetchInventory = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/inventory");
      setMockMode(res.headers.get("X-Mock-Mode") === "true");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load inventory.");
      }
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Inventory is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleIncrement = useCallback((item: InventoryItem) => {
    setQueue((prev) => {
      const existing = prev.find((q) => q.cut_id === item.cut_id);
      const current = existing?.qty ?? 0;
      if (current >= item.available_qty) return prev;
      const minQty = item.min_qty ?? 1;
      if (existing) {
        return prev.map((q) =>
          q.cut_id === item.cut_id ? { ...q, qty: q.qty + 1 } : q
        );
      }
      return [...prev, { cut_id: item.cut_id, cut_name: item.cut_name, qty: minQty, unit: item.unit, price: item.price }];
    });
  }, []);

  const handleDecrement = useCallback((item: InventoryItem) => {
    setQueue((prev) => {
      const existing = prev.find((q) => q.cut_id === item.cut_id);
      if (!existing) return prev;
      const minQty = item.min_qty ?? 1;
      const nextQty = existing.qty - 1;
      if (nextQty < minQty || nextQty <= 0) {
        return prev.filter((q) => q.cut_id !== item.cut_id);
      }
      return prev.map((q) =>
        q.cut_id === item.cut_id ? { ...q, qty: nextQty } : q
      );
    });
  }, []);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
    setShowCustomerForm(false);
    setCheckoutStep("customer");
    setCustomerData(null);
    setSubmitError(null);
    setSuccessOrder(null);
  }, []);

  const handleSubmitOrder = useCallback(() => {
    setSubmitError(null);
    setCheckoutStep("customer");
    setCustomerData(null);
    setSuccessOrder(null);
    setShowCustomerForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleCustomerSubmit = useCallback((formData: CustomerFormData) => {
    setCustomerData(formData);
    setSubmitError(null);
    setCheckoutStep("pickup");
  }, []);

  const handlePickupConfirm = useCallback(
    async (pickup: PickupChoice) => {
      if (!customerData || queue.length === 0) return;
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const res = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: customerData.customer_name,
            phone: customerData.phone,
            email: customerData.email || undefined,
            items: queue.map((q) => ({ cut_id: q.cut_id, qty: q.qty })),
            pickup_date: pickup.pickup_date,
            pickup_time_slot: pickup.pickup_time_slot,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitError(data.error ?? "Failed to place order. Please try again.");
          return;
        }
        setSuccessOrder({
          orderId: data.order_id ?? "",
          pickupDate: pickup.pickup_date,
          pickupTimeSlot: pickup.pickup_time_slot,
        });
        setQueue([]);
        setShowCustomerForm(false);
        setCheckoutStep("customer");
        setCustomerData(null);
        await fetchInventory();
      } catch {
        setSubmitError("Network error. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [customerData, queue, fetchInventory]
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]" data-beef-root style={{ minHeight: "100vh" }}>
      {/* Banner: full-width ranch logo */}
      <header className="relative flex items-center justify-center bg-[var(--color-bg-card)] px-2 py-4 sm:py-6">
        <img
          src="/icons/logo.jpg"
          alt="Clements Cattle Co."
          className="h-[250px] w-auto max-w-full rounded-md object-contain shadow-sm"
        />
      </header>
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-card)] px-1 py-3 lg:px-4">
        <p className="text-sm text-[var(--color-muted)]">Select cuts and submit your order.</p>
      </div>

      <main className="mx-auto max-w-6xl px-2 py-6 lg:flex lg:gap-8">
        <div className="flex-1 lg:min-w-0">
          {loading ? (
            <p className="text-[var(--color-muted)]">Loading inventory…</p>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              {error}
              <button
                type="button"
                onClick={() => { setLoading(true); fetchInventory(); }}
                className="ml-2 underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <InventoryList
              inventory={inventory}
              queue={queue}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          )}
        </div>

        <aside className="mt-6 hidden lg:block lg:mt-0 lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-6">
            <QueueSummary
              items={queue}
              onClear={handleClearQueue}
              onSubmit={handleSubmitOrder}
              isSubmitting={isSubmitting}
            />
          </div>
        </aside>
      </main>

      {showCustomerForm && (
        <>
          {/* Mobile: full-width receipt-style panel, absolutely positioned under sticky bar */}
          <div className="fixed inset-x-0 bottom-0 top-20 z-30 overflow-auto px-2 pt-2 lg:hidden">
            <div className="rounded-b-lg border-t-2 border-dotted border-[var(--color-border)] bg-[var(--color-bg-card)] pb-6 shadow-md">
              <div className="px-4 pt-4">
                {/* Checkout progress: bar + icons (cart | avatar | calendar) */}
                <div className="mb-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                    <div
                      className="h-full bg-[var(--color-blue)] transition-all duration-300"
                      style={{ width: checkoutStep === "customer" ? "50%" : "100%" }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between">
                    {/* Far left: shopping cart */}
                    <span className={checkoutStep === "customer" || checkoutStep === "pickup" ? "text-[var(--color-blue)]" : "text-[var(--color-muted)]"}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </span>
                    {/* Center: avatar */}
                    <span className={checkoutStep === "customer" ? "text-[var(--color-blue)]" : checkoutStep === "pickup" ? "text-[var(--color-blue)]" : "text-[var(--color-muted)]"}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                      </svg>
                    </span>
                    {/* Far right: calendar */}
                    <span className={checkoutStep === "pickup" ? "text-[var(--color-blue)]" : "text-[var(--color-muted)]"}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                  </div>
                </div>
                {checkoutStep === "customer" ? (
                  <>
                    <h2 id="checkout-title" className="font-header mb-4 text-lg text-[var(--color-charcoal)]">
                      Customer information
                    </h2>
                    <CustomerForm
                      onSubmit={handleCustomerSubmit}
                      onCancel={() => {
                        setShowCustomerForm(false);
                        setSubmitError(null);
                        setCheckoutStep("customer");
                        setCustomerData(null);
                      }}
                      isSubmitting={false}
                      error={submitError}
                    />
                  </>
                ) : (
                  <>
                    <h2 id="checkout-title" className="font-header mb-4 text-lg text-[var(--color-charcoal)]">
                      When can you pick up?
                    </h2>
                    <PickupStep
                      onConfirm={handlePickupConfirm}
                      onBack={() => setCheckoutStep("customer")}
                      isSubmitting={isSubmitting}
                      error={submitError}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: keep centered modal */}
          <div
            className="fixed inset-0 z-10 hidden items-center justify-center bg-black/40 p-4 lg:flex"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-[var(--color-bg-card)] p-6 shadow-lg">
              {/* Checkout progress: bar + icons (cart | avatar | calendar) */}
              <div className="mb-6">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div
                    className="h-full bg-[var(--color-blue)] transition-all duration-300"
                    style={{ width: checkoutStep === "customer" ? "50%" : "100%" }}
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <span className={checkoutStep === "customer" || checkoutStep === "pickup" ? "text-[var(--color-blue)]" : "text-[var(--color-muted)]"}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </span>
                  <span className={checkoutStep === "customer" ? "text-[var(--color-blue)]" : checkoutStep === "pickup" ? "text-[var(--color-blue)]" : "text-[var(--color-muted)]"}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </span>
                  <span className={checkoutStep === "pickup" ? "text-[var(--color-blue)]" : "text-[var(--color-muted)]"}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                </div>
              </div>
              {checkoutStep === "customer" ? (
                <>
                  <h2 id="checkout-title" className="font-header mb-4 text-lg text-[var(--color-charcoal)]">
                    Customer information
                  </h2>
                  <CustomerForm
                    onSubmit={handleCustomerSubmit}
                    onCancel={() => {
                      setShowCustomerForm(false);
                      setSubmitError(null);
                      setCheckoutStep("customer");
                      setCustomerData(null);
                    }}
                    isSubmitting={false}
                    error={submitError}
                  />
                </>
              ) : (
                <>
                  <h2 id="checkout-title" className="font-header mb-4 text-lg text-[var(--color-charcoal)]">
                    When can you pick up?
                  </h2>
                  <PickupStep
                    onConfirm={handlePickupConfirm}
                    onBack={() => setCheckoutStep("customer")}
                    isSubmitting={isSubmitting}
                    error={submitError}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {successOrder && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div className="w-full max-w-md">
            <OrderSuccessScreen
              orderId={successOrder.orderId}
              pickupDate={successOrder.pickupDate}
              pickupTimeSlot={successOrder.pickupTimeSlot}
              onDismiss={() => setSuccessOrder(null)}
            />
          </div>
        </div>
      )}

      {/* Mobile: sticky queue bar - hidden until queue has items, then pinned to top */}
      {queue.length > 0 && (
        <>
          <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 border-b-2 border-dotted border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-3 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileQueueDetails((prev) => !prev)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <div className="flex -space-x-2">
                {Array.from(new Map(queue.map((q) => [q.cut_id, q])).values())
                  .slice(0, 3)
                  .map((item) => {
                    const slug = getCutIconSlug({ cut_id: item.cut_id, cut_name: item.cut_name });
                    return (
                      <div
                        key={item.cut_id}
                        className="h-8 w-8 rounded-full border-2 border-white bg-gray-100"
                      >
                        <img
                          src={`/icons/cuts/${slug}.svg`}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                          aria-hidden
                        />
                      </div>
                    );
                  })}
                {new Set(queue.map((q) => q.cut_id)).size > 3 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--color-bg-card)] text-xs font-semibold text-[var(--color-muted)]">
                    …
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-[var(--color-muted)]">Queue</span>
                <span className="text-sm font-medium text-[var(--color-charcoal)]">
                  {`${queue.reduce((s, i) => s + i.qty, 0)} items`}
                </span>
              </div>
            </button>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearQueue}
                className="flex items-center justify-center rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-charcoal)] hover:bg-[var(--color-blue)]/10"
                aria-label="Clear queue"
              >
                <img src="/icons/trash.svg" alt="" className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex flex-col items-center justify-center gap-0.5 rounded-lg bg-[var(--color-blue)] px-4 py-3 min-w-[7rem] text-white disabled:opacity-50 hover:opacity-90"
              >
                <span className="text-sm font-medium leading-tight">
                  {isSubmitting ? "Submitting…" : "Submit order"}
                </span>
                {totalAmount > 0 && !isSubmitting && (
                  <span className="text-xl font-semibold tabular-nums leading-tight">{formatTotal(totalAmount)}</span>
                )}
              </button>
            </div>
          </div>
          <div className="h-20 lg:hidden" aria-hidden />
          {showMobileQueueDetails && (
            <div className="fixed inset-x-0 top-20 z-20 lg:hidden border-b-2 border-dotted border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-3">
              <ul className="space-y-2 text-sm">
                {Array.from(new Map(queue.map((q) => [q.cut_id, q])).values()).map((item) => (
                  <li key={item.cut_id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-[var(--color-charcoal)]">{item.cut_name}</span>
                    <span className="tabular-nums text-[var(--color-muted)]">
                      {item.qty} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
