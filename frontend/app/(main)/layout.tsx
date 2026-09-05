// app/(main)/layout.tsx
// Main app shell: warm beige canvas, forest-green bottom nav, terracotta FAB.
// AuthGate bounces unauthenticated visitors to /login.
"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { FabAddExpense } from "@/components/layout/FabAddExpense";
import { ExpenseSheetProvider } from "@/components/layout/ExpenseSheetProvider";
import { AuthGate } from "@/components/auth/AuthGate";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <ExpenseSheetProvider>
        <div className="relative min-h-screen bg-bg-base pb-24">
          {children}
          <BottomNav />
          <FabAddExpense />
        </div>
      </ExpenseSheetProvider>
    </AuthGate>
  );
}
