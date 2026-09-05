// app/(main)/dashboard/page.tsx
// Personal ledger landing. Big, bold editorial heading in forest green with a
// terracotta accent bar — live data, no demo values.
"use client";

import { useState } from "react";
import { MonthlyLedgerView } from "@/components/ledger/MonthlyLedgerView";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useExpenseSheet } from "@/components/layout/ExpenseSheetProvider";
import { Reveal } from "@/components/motion";

export default function DashboardPage() {
  const { isOpen: expenseSheetOpen, close: closeExpenseSheet } = useExpenseSheet();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExpenseCreated = () => {
    closeExpenseSheet();
    setRefreshKey((k) => k + 1); // re-fetch the ledger
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Editorial header ──────────────────────────────────────── */}
      <header className="px-4 pb-2 pt-10">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
            Personal · All amounts in PKR
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
            Your Ledger
          </h1>
          {/* Terracotta accent bar — the 10% doing quiet work */}
          <span
            aria-hidden="true"
            className="mt-3 block h-1.5 w-16 rounded-full bg-terracotta"
          />
          <p className="mt-4 max-w-sm text-base text-ink">
            Track every rupee you spend — food, books, transport and more.
          </p>
        </Reveal>
      </header>

      {/* ── Monthly ledger ────────────────────────────────────────── */}
      <MonthlyLedgerView refreshKey={refreshKey} />

      {/* Add Expense Sheet */}
      {expenseSheetOpen && (
        <ExpenseForm
          onSuccess={handleExpenseCreated}
          onClose={closeExpenseSheet}
        />
      )}
    </div>
  );
}