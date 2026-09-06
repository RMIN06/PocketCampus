// app/(main)/activity/page.tsx
// Recent personal expenses from the live API — no demo data.
"use client";

import { useEffect, useState } from "react";
import { formatRelativeDate, formatCurrency, formatFullDate } from "@/lib/format";
import { FillPanel, Reveal, RevealList, RevealItem } from "@/components/motion";
import { expensesApi, ApiError } from "@/lib/api-client";
import type { ExpensePublic } from "@/lib/types";
import { useExpenseSheet } from "@/components/layout/ExpenseSheetProvider";

export default function ActivityPage() {
  const { refreshKey } = useExpenseSheet();
  const [expenses, setExpenses] = useState<ExpensePublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await expensesApi.list(); // all recent, newest first
        setExpenses(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load activity");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [refreshKey]);

  const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisWeek = expenses.filter((e) => {
    const ageDays = (Date.now() - new Date(e.created_at).getTime()) / 86_400_000;
    return ageDays >= 0 && ageDays <= 7;
  });
  const weekTotal = thisWeek.reduce((sum, expense) => sum + expense.amount, 0);
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-terracotta border-t-transparent" />
        <p className="mt-4 text-sm text-ink-soft">Loading activity…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
        <svg className="w-12 h-12 text-terracotta-dark mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-ink-soft">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden pb-24">
      {/* ── Editorial header ─────────────────────────────────────────── */}
      <header className="px-4 pt-10">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
            Your money, recently
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
            Activity
          </h1>
          <span
            aria-hidden="true"
            className="mt-3 block h-1.5 w-16 rounded-full bg-terracotta"
          />
        </Reveal>
      </header>

      {/* ── Stats fill panel ─────────────────────────────────────────── */}
      <div className="px-4 pt-6">
        <FillPanel fill="bg-forest" className="rounded-2xl">
          <div className="flex items-center justify-around p-5">
            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight tabular-nums text-[#F5E6CC]">
                {formatCurrency(weekTotal)}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E6CC]/70">
                Last 7 days
              </p>
            </div>
            <div className="h-10 w-px bg-[#F5E6CC]/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight tabular-nums text-[#F5E6CC]">
                {expenses.length}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E6CC]/70">
                Total logged
              </p>
            </div>
            <div className="h-10 w-px bg-[#F5E6CC]/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight tabular-nums text-[#F5E6CC]">
                {formatCurrency(totalAll)}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E6CC]/70">
                All time
              </p>
            </div>
          </div>
        </FillPanel>
      </div>

      {/* Recent expenses */}
      <RevealList className="flex-1 space-y-3 px-4 py-5">
        {expenses.length === 0 ? (
          <RevealItem>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-16 h-16 text-ink-soft/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-ink-soft">No expenses yet</p>
              <p className="text-ink-soft text-sm mt-1">Tap the + button to log your first one</p>
            </div>
          </RevealItem>
        ) : (
          expenses.slice(0, 50).map((expense) => (
            <RevealItem key={expense.id}>
              <div className="flex items-start gap-3 p-3 bg-bg-surface rounded-2xl border border-border-subtle shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {expense.description}
                  </p>
                  <p className="text-xs text-ink-soft mt-1">
                    {formatFullDate(expense.created_at)} · {formatRelativeDate(expense.created_at)}
                  </p>
                </div>
                <span className="text-sm font-extrabold tracking-tight text-forest shrink-0 tabular-nums">
                  {formatCurrency(expense.amount, expense.currency)}
                </span>
              </div>
            </RevealItem>
          ))
        )}
      </RevealList>
    </div>
  );
}
