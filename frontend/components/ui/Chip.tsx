// components/ui/Chip.tsx
import { HTMLAttributes, forwardRef } from "react";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  variant?: "default" | "success" | "danger" | "accent";
  selected?: boolean;
  onClick?: () => void;
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ label, variant = "default", selected = false, onClick, className = "", ...props }, ref) => {
    const variantStyles = {
      default: "bg-bg-surface-elevated text-ink-soft border-border-subtle",
      success: "bg-forest-tint text-forest border-forest/20",
      danger: "bg-terracotta-tint text-terracotta-dark border-terracotta-dark/20",
      accent: "bg-terracotta-tint text-terracotta border-terracotta/20",
    };

    const baseStyles =
      "inline-flex items-center justify-center px-3 py-1 text-sm rounded-full border transition-all duration-200 min-w-0 max-w-full";

    const selectedStyles = selected
      ? "bg-terracotta-tint border-terracotta text-forest-dark font-semibold"
      : "";

    const interactiveStyles = onClick
      ? "cursor-pointer min-h-11 px-4 py-1.5 hover:border-terracotta/60 active:scale-[0.97] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      : "";

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <span
        ref={ref}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        className={`${baseStyles} ${!selected ? variantStyles[variant] : ""} ${selectedStyles} ${interactiveStyles} ${className}`}
        {...props}
      >
        {label}
      </span>
    );
  }
);

Chip.displayName = "Chip";