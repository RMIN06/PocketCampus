// components/ledger/MonthSelector.tsx
"use client";

import { useState } from "react";
import { formatMonthLabel, getCurrentMonth, shiftMonth } from "@/lib/format";
import { Button } from "@/components/ui/Button";

interface MonthSelectorProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthSelector = ({
  currentMonth,
  onMonthChange,
}: MonthSelectorProps) => {
  const [displayMonth, setDisplayMonth] = useState(currentMonth);

  const handlePrev = () => {
    const prev = shiftMonth(displayMonth, -1);
    setDisplayMonth(prev);
    onMonthChange(prev);
  };

  const handleNext = () => {
    const next = shiftMonth(displayMonth, 1);
    // Don't allow future months
    if (next <= getCurrentMonth()) {
      setDisplayMonth(next);
      onMonthChange(next);
    }
  };

  const isCurrentMonth = displayMonth === getCurrentMonth();

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrev}
        aria-label="Previous month"
        className="p-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      <span className="text-lg font-medium text-text-primary">
        {formatMonthLabel(displayMonth)}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleNext}
        disabled={isCurrentMonth}
        aria-label="Next month"
        className="p-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  );
};