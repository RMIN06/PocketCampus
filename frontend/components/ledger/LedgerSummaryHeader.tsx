// components/ledger/LedgerSummaryHeader.tsx
// The signature colour-fill moment: a forest-green panel that wipes upward
// as it scrolls into view (motion.dev), carrying beige text and a bold number.
// Shows total spent this month (PKR).
"use client";

import { formatCurrency } from "@/lib/format";
import { FillPanel } from "@/components/motion";

interface LedgerSummaryHeaderProps {
  total: number;
  count: number;
}

export const LedgerSummaryHeader = ({ total, count }: LedgerSummaryHeaderProps) => {
  return (
    <FillPanel
      fill="bg-forest"
      className="rounded-2xl border border-forest-dark/20 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#F5E6CC]/70">
            Spent this month
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#F5E6CC] tabular-nums">
            {formatCurrency(total)}
          </p>
          <p className="mt-1 text-sm text-[#F5E6CC]/80">
            {count === 0
              ? "No expenses yet"
              : `${count} expense${count !== 1 ? "s" : ""} logged`}
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-full bg-[#F5E6CC]/15 text-[#F5E6CC]">
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
      </div>
      <p className="mt-2 text-sm text-[#F5E6CC]/70">
        Your personal spending · all amounts in Pakistani Rupees
      </p>
    </FillPanel>
  );
};
