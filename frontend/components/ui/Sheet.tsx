// components/ui/Sheet.tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const Sheet = ({ open, onClose, children, title }: SheetProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="absolute inset-0 bg-forest-dark/40 animate-fade-in"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute bottom-0 left-0 right-0 flex flex-col bg-bg-surface-elevated rounded-t-3xl animate-slide-up max-h-[88svh] shadow-[0_-8px_24px_rgba(34,59,21,0.18)]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-4 pb-4 flex items-center justify-between gap-3 shrink-0">
            <h2 className="text-2xl font-semibold text-forest-dark truncate min-w-0">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="h-11 w-11 -mr-3 shrink-0 flex items-center justify-center rounded-full hover:bg-terracotta-tint active:scale-[0.97] transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-ink-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content — scrollable body pinned above the safe area */}
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};