// components/layout/FabAddExpense.tsx
// Terracotta FAB (10% accent) with a springy press via motion.dev.
// Positioned with left-calc (not translate) so motion's scale never
// fights Tailwind transforms.
"use client";

import { motion, useReducedMotion } from "motion/react";
import { useExpenseSheet } from "./ExpenseSheetProvider";

export const FabAddExpense = () => {
  const { open } = useExpenseSheet();
  const reduce = useReducedMotion();

  return (
    <motion.button
      onClick={() => open()}
      aria-label="Add expense"
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={reduce ? undefined : { scale: 0.88 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+32px)] left-[calc(50%-28px)] z-50 flex size-14 items-center justify-center rounded-full bg-terracotta text-white shadow-lg shadow-terracotta/40"
    >
      <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </motion.button>
  );
};
