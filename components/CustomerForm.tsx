"use client";

import { useState, useCallback } from "react";

export interface CustomerFormData {
  customer_name: string;
  phone: string;
  email: string;
}

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const MAX_NAME = 200;
const MAX_PHONE = 50;
const MAX_EMAIL = 254;

export function CustomerForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  error: externalError = null,
}: CustomerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.customer_name = "Name is required.";
    if (!phone.trim()) next.phone = "Phone is required.";
    if (email.trim() && email.length > MAX_EMAIL) next.email = "Email is too long.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, phone, email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      customer_name: name.trim().slice(0, MAX_NAME),
      phone: phone.trim().slice(0, MAX_PHONE),
      email: email.trim().slice(0, MAX_EMAIL),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {externalError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {externalError}
        </div>
      )}
      <div>
        <label htmlFor="customer_name" className="mb-1 block text-sm font-medium text-[var(--color-charcoal)]">
          Name *
        </label>
        <input
          id="customer_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-[var(--color-charcoal)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
          placeholder="John Smith"
        />
        {errors.customer_name && (
          <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
        )}
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-[var(--color-charcoal)]">
          Phone *
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={MAX_PHONE}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-[var(--color-charcoal)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
          placeholder="555-123-4567"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--color-charcoal)]">
          Email (optional)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={MAX_EMAIL}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-[var(--color-charcoal)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-blue)]/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[var(--color-blue)] px-4 py-2.5 font-medium text-white disabled:opacity-50 hover:opacity-90"
        >
          {isSubmitting ? "Placing order…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
