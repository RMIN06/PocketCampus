// components/expenses/ExpenseForm.tsx
// Simple personal-expense entry: description, amount in PKR, category.
"use client";

import { useState } from "react";
import { useExpenseFormStore } from "@/store/expenseFormStore";
import { expensesApi } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { CategoryPicker } from "./CategoryPicker";
import type { ExpensePublic } from "@/lib/types";

interface ExpenseFormProps {
  onSuccess: (expense: ExpensePublic) => void;
  onClose: () => void;
}

export const ExpenseForm = ({ onSuccess, onClose }: ExpenseFormProps) => {
  const {
    description,
    totalAmount,
    category,
    setDescription,
    setTotalAmount,
    setCategory,
    reset,
  } = useExpenseFormStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim() || !totalAmount || totalAmount <= 0) {
      setError("Please enter a description and an amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const expense = await expensesApi.create({
        description: description.trim(),
        amount: totalAmount,
        category,
        currency: "PKR",
      });
      reset();
      onSuccess(expense);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to save expense. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = description.trim() && totalAmount && totalAmount > 0;

  return (
    <Sheet open={true} onClose={onClose} title="Add Expense">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        {error && (
          <div className="p-3 bg-terracotta-tint border border-terracotta-dark/20 rounded-xl text-terracotta-dark text-sm">
            {error}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Chai and paratha at campus cafe"
            className="w-full px-4 py-3 bg-bg-surface-elevated border border-border-subtle rounded-xl text-base text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
            maxLength={120}
            autoFocus
          />
        </div>

        {/* Amount (PKR) */}
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft font-semibold">Rs</span>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              min="1"
              value={totalAmount ?? ""}
              onChange={(e) => setTotalAmount(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0"
              className="w-full px-4 py-3 pl-12 bg-bg-surface-elevated border border-border-subtle rounded-xl text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent text-2xl font-medium"
            />
          </div>
        </div>

        {/* Category Picker */}
        <CategoryPicker value={category} onChange={setCategory} />

        {/* Sticky footer CTA — pinned above env(safe-area-inset-bottom) by the Sheet */}
        <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-2 bg-bg-surface-elevated [box-shadow:0_-8px_16px_-12px_rgba(74,74,74,0.25)]">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            Save Expense
          </Button>

          <p className="text-xs text-ink-soft text-center mt-2">
            Swipe down or tap outside to cancel
          </p>
        </div>
      </form>
    </Sheet>
  );
};
