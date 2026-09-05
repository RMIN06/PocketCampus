// components/expenses/CategoryPicker.tsx
"use client";

import type { ExpenseCategory } from "@/lib/types";

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
  {
    value: "food",
    label: "Food",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "groceries",
    label: "Groceries",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    value: "books",
    label: "Books",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    value: "transport",
    label: "Transport",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-2-4H10L8 7zm0 0v6H8m12 0v6m0 0H8m12 0l-2 4H10l-2-4m4-6v4m6 2h.01M8 17h.01M8 7h.01" />
      </svg>
    ),
  },
  {
    value: "rent",
    label: "Rent",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
      </svg>
    ),
  },
  {
    value: "utilities",
    label: "Utilities",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    value: "other",
    label: "Other",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

interface CategoryPickerProps {
  value: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
}

export const CategoryPicker = ({ value, onChange }: CategoryPickerProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink-soft">Category</label>
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ${
              value === cat.value
                ? "border-terracotta bg-terracotta-tint text-forest-dark font-semibold"
                : "border-border-subtle bg-bg-surface-elevated text-ink hover:border-terracotta/60"
            }`}
          >
            <span className="text-lg" aria-hidden="true">{cat.icon}</span>
            <span className="text-xs font-semibold text-center leading-tight">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};