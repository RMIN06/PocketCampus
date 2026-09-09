"use client";

import { useEffect, useState } from "react";
import { budgetsApi } from "@/lib/api-client";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import type { MonthlyBudget } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function MonthlyBudgetCard({ month, refreshKey }: { month: string; refreshKey: number }) {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [amount, setAmount] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setBudget(null);
    setError("");
    budgetsApi.get(month).then(data => {
      if (!active) return;
      setBudget(data);
      setAmount(data.amount?.toString() || "");
      setEditing(data.amount === null);
    }).catch(err => { if (active) setError(err.message || "Budget could not load."); });
    return () => { active = false; };
  }, [month, refreshKey, retry]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 999999999 || !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError("Enter a budget between Rs 0.01 and Rs 999,999,999, with up to two decimal places.");
      return;
    }
    setBusy(true); setError("");
    try {
      setBudget(await budgetsApi.set(month, value));
      setEditing(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Budget could not be saved."); }
    finally { setBusy(false); }
  }

  return <section aria-label="Monthly budget" className="mx-4 mb-5 rounded-2xl border border-border-subtle bg-bg-surface p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold text-forest">Monthly budget</h2>
      {budget?.amount && !editing ? <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit budget</Button> : null}
    </div>
    <p className="mb-4 text-sm text-ink-soft">{formatMonthLabel(month)} · PKR · Pakistan time</p>
    {error && <div role="alert" className="mb-3 text-sm text-terracotta-dark">{error} {!budget && <Button size="sm" variant="ghost" onClick={() => setRetry(v => v + 1)}>Retry</Button>}</div>}
    {!budget && !error && <p role="status">Loading budget…</p>}
    {budget?.amount != null && <>
      <p className="text-sm text-ink-soft">{(budget.remaining ?? 0) < 0 ? "Over budget" : "Remaining"}</p>
      <p className="text-3xl font-bold text-forest">{formatCurrency(Math.abs(budget.remaining ?? 0))}</p>
      <p className="mt-1 text-sm text-ink-soft">{formatCurrency(budget.spent)} spent of {formatCurrency(budget.amount)}</p>
      <progress className="my-3 h-3 w-full accent-forest" aria-label="Monthly budget spent" value={Math.min(budget.spent, budget.amount)} max={budget.amount} />
      {budget.alert && <p role="alert" className="rounded-xl bg-terracotta-tint p-3 text-sm font-semibold text-terracotta-dark">
        {(budget.remaining ?? 0) <= 0 ? "You have used your entire monthly budget." : "Budget alert: 50% or less of your monthly budget remains."}
      </p>}
    </>}
    {budget && editing && <form onSubmit={save} className="mt-3 space-y-3">
      <label htmlFor="monthly-budget" className="block text-sm font-medium">Total monthly budget (Rs)</label>
      <input id="monthly-budget" type="number" inputMode="decimal" min="0.01" max="999999999" step="0.01" required value={amount} disabled={busy}
        onChange={e => setAmount(e.target.value)} placeholder="e.g. 20000" className="w-full rounded-xl border border-border-subtle bg-bg-surface-elevated p-3 text-base focus-visible:outline-forest" />
      <p className="text-xs text-ink-soft">Expenses subtract automatically. An in-app alert appears at 50% remaining. Set a separate budget each month.</p>
      <div className="flex gap-2"><Button type="submit" size="sm" loading={busy}>Save budget</Button>
        {budget.amount != null && <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => {setEditing(false); setAmount(String(budget.amount)); setError("");}}>Cancel</Button>}</div>
    </form>}
  </section>;
}
