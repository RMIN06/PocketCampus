// components/ui/Button.tsx
// The signature control: colour-fill on hover + springy press (motion.dev).
// Hovering sweeps a solid fill layer up from the bottom edge — terracotta
// buttons flood forest green, forest buttons flood deep terracotta.
// Tapping compresses the button with a spring. Reduced motion = static.
"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

// Omit the native animation/drag handlers that motion.dev redefines with
// incompatible signatures (AnimationDefinition vs DOM events) — type-only fix.
interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDragStart" | "onDrag" | "onDragEnd"
  > {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const VARIANTS = {
  // 10% accent doing its job: terracotta base → forest fill on hover.
  primary: { base: "bg-terracotta text-white", fill: "bg-forest" },
  // 30% secondary: forest base → deep terracotta fill on hover.
  secondary: { base: "bg-forest text-[#F5E6CC]", fill: "bg-terracotta-dark" },
  ghost: { base: "bg-transparent text-ink", fill: "bg-forest-tint" },
  danger: { base: "bg-terracotta-dark text-white", fill: "bg-forest-dark" },
} as const;

const SIZE_STYLES = {
  sm: "px-3 min-h-11 py-1.5 text-sm",
  md: "px-5 min-h-11 py-2.5 text-base",
  lg: "px-7 min-h-11 py-3.5 text-lg",
};

const GAP_STYLES = {
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const reduce = useReducedMotion();
    const v = VARIANTS[variant];
    const isStatic = Boolean(disabled || loading) || reduce;

    const pressVariants: Variants = {
      rest: { scale: 1 },
      hover: { scale: 1.02 },
      tap: { scale: 0.96 },
    };

    return (
      <motion.button
        ref={ref}
        initial="rest"
        whileHover={isStatic ? undefined : "hover"}
        whileTap={isStatic ? undefined : "tap"}
        variants={pressVariants}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`relative inline-flex select-none items-center justify-center overflow-hidden rounded-full font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-50 ${v.base} ${SIZE_STYLES[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {/* Colour-fill layer that sweeps up on hover */}
        {!isStatic && (
          <motion.span
            aria-hidden="true"
            className={`absolute inset-0 ${v.fill}`}
            style={{ transformOrigin: "bottom" }}
            variants={{
              rest: { scaleY: 0 },
              hover: {
                scaleY: 1,
                transition: { duration: 0.28, ease: [0.65, 0, 0.35, 1] },
              },
            }}
          />
        )}
        <span
          className={`relative z-10 inline-flex items-center justify-center ${GAP_STYLES[size]}`}
        >
          {loading && (
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";
