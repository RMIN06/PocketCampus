// store/expenseFormStore.ts
// Zustand store for in-progress expense entry (ephemeral state, not persisted).

import { create } from "zustand";
import type { ExpenseCategory } from "@/lib/types";

interface ExpenseFormState {
  // Form fields
  description: string;
  totalAmount: number | null;
  category: ExpenseCategory;

  // Actions
  setDescription: (value: string) => void;
  setTotalAmount: (value: number | null) => void;
  setCategory: (value: ExpenseCategory) => void;
  reset: () => void;
}

const initialState = {
  description: "",
  totalAmount: null as number | null,
  category: "other" as ExpenseCategory,
};

export const useExpenseFormStore = create<ExpenseFormState>((set) => ({
  ...initialState,

  setDescription: (value) => set({ description: value }),
  setTotalAmount: (value) => set({ totalAmount: value }),
  setCategory: (value) => set({ category: value }),

  reset: () => set(initialState),
}));