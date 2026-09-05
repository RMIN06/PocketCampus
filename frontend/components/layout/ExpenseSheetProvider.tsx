// components/layout/ExpenseSheetProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ExpenseSheetContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ExpenseSheetContext = createContext<ExpenseSheetContextType | undefined>(undefined);

export const ExpenseSheetProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ExpenseSheetContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
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