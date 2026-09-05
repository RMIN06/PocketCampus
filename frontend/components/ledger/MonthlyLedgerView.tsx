// components/ledger/MonthlyLedgerView.tsx
// Groups personal ExpenseCards by date with a scroll-revealed summary header
// and staggered card entrances. Live data from the FastAPI + MongoDB backend.
"use client";

import { useEffect, useState } from "react";
import { getCurrentMonth } from "@/lib/format";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { LedgerSummaryHeader } from "./LedgerSummaryHeader";
import { MonthSelector } from "./MonthSelector";
import { Reveal, RevealList, RevealItem } from "@/components/motion";
import { expensesApi } from "@/lib/api-client";
import type { ExpensePublic } from "@/lib/types";

function groupByDate(expenses: ExpensePublic[]): Map<string, ExpensePublic[]> {
  const grouped = new Map<string, ExpensePublic[]>();
  for (const expense of expenses) {
    const date = new Date(expense.created_at);
    const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(expense);
  }
  return grouped;
}

interface MonthlyLedgerViewProps {
  refreshKey?: number;
}

export const MonthlyLedgerView = ({ refreshKey = 0 }: MonthlyLedgerViewProps) => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [expenses, setExpenses] = useState<ExpensePublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await expensesApi.list(month);
        setExpenses(data);
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Failed to load your expenses"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [month, refreshKey]);

  const groupedExpenses = groupByDate(expenses);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-terracotta border-t-transparent" />
        <p className="text-ink-soft mt-4">Loading your ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <svg className="w-12 h-12 text-terracotta-dark mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-ink-soft">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-24">
      {/* Month selector */}
      <MonthSelector currentMonth={month} onMonthChange={setMonth} />

      {/* Summary header */}
      <Reveal className="px-4 pb-4">
        <LedgerSummaryHeader total={total} count={expenses.length} />
      </Reveal>

      {/* Expenses list */}
      {groupedExpenses.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <svg className="w-16 h-16 text-ink-soft/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-ink-soft text-lg">No expenses this month</p>
          <p className="text-ink-soft text-sm mt-1">Tap the + button to add one</p>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {Array.from(groupedExpenses.entries()).map(([date, dayExpenses]) => (
            <section key={date} className="space-y-3">
              <Reveal>
                <p className="text-xs font-bold uppercase tracking-wide px-1 text-ink-soft">
                  {date}
                </p>
              </Reveal>
              <RevealList interval={0.06} className="space-y-3">
                {dayExpenses.map((expense) => (
                  <RevealItem key={expense.id}>
                    <ExpenseCard expense={expense} />
                  </RevealItem>
                ))}
              </RevealList>
            </section>
          ))}
        </div>
      )}

      {/* Bottom padding for FAB */}
      <div className="h-24" />
    </div>
  );
};
