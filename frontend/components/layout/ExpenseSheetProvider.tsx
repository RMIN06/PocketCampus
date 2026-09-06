// components/layout/ExpenseSheetProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

interface ExpenseSheetContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  refreshKey: number;
}

const ExpenseSheetContext = createContext<ExpenseSheetContextType | undefined>(undefined);

export const ExpenseSheetProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ExpenseSheetContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false), refreshKey }}>
      {children}
      {isOpen && (
        <ExpenseForm
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </ExpenseSheetContext.Provider>
  );
};

export const useExpenseSheet = () => {
  const context = useContext(ExpenseSheetContext);
  if (!context) {
    throw new Error("useExpenseSheet must be used within an ExpenseSheetProvider");
  }
  return context;
};
