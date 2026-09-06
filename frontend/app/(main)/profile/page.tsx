// app/(main)/profile/page.tsx
// Signed-in Google account, spending snapshot, sign out.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersApi, expensesApi } from "@/lib/api-client";
import { getStoredUser, clearAuth } from "@/lib/auth";
import { FillPanel, Reveal } from "@/components/motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatCurrency, getCurrentMonth, formatMonthLabel } from "@/lib/format";
import type { UserPublic, ExpenseSummary } from "@/lib/types";
import { useExpenseSheet } from "@/components/layout/ExpenseSheetProvider";

export default function ProfilePage() {
  const { refreshKey } = useExpenseSheet();
  const router = useRouter();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setUser(getStoredUser());
      const month = getCurrentMonth();
      try {
        const [me, s] = await Promise.all([
          usersApi.getMe(),
          expensesApi.summary(month),
        ]);
        setUser(me);
        setSummary(s);
      } catch {
        // Fall back to the locally stored user; summary stays null
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [refreshKey]);

  const handleSignOut = () => {
    clearAuth();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
        <p className="text-ink-soft">Not signed in</p>
        <Button variant="primary" className="mt-4" onClick={handleSignOut}>
          Go to sign in
        </Button>
      </div>
    );
  }

  const monthLabel = formatMonthLabel(summary?.month ?? getCurrentMonth());

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden pb-24">
      {/* ── Editorial header ─────────────────────────────────────────── */}
      <header className="px-4 pt-10">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
            Signed in with Google
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
            Your Profile
          </h1>
          <span
            aria-hidden="true"
            className="mt-3 block h-1.5 w-16 rounded-full bg-terracotta"
          />
        </Reveal>
      </header>

      {/* ── Profile card ─────────────────────────────────────────────── */}
      <div className="space-y-4 px-4 py-6">
        <FillPanel fill="bg-forest" className="rounded-2xl">
          <div className="flex items-center gap-4 p-5">
            <Avatar
              src={user.picture || undefined}
              name={user.full_name}
              size="xl"
              shape="circle"
            />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-[#F5E6CC]">
                {user.full_name}
              </p>
              <p className="truncate text-sm text-[#F5E6CC]/80">{user.email}</p>
            </div>
          </div>
        </FillPanel>

        {/* Spending snapshot */}
        <Reveal>
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
              {monthLabel} spending
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-forest">
              {summary ? formatCurrency(summary.total) : formatCurrency(0)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {summary
                ? `${summary.count} expense${summary.count !== 1 ? "s" : ""} · all amounts in Pakistani Rupees`
                : "Connect the backend to see your monthly spending"}
            </p>
          </div>
        </Reveal>

        {/* Sign out */}
        <Reveal>
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
