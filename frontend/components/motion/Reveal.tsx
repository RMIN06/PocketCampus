// components/motion/Reveal.tsx
// Restrained scroll-in reveal (motion.dev). Fades + rises once, then stays.
// Renders statically when the user prefers reduced motion.
"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Extra delay in seconds (use inside plain containers, not RevealList). */
  delay?: number;
  /** Initial vertical offset in px. */
  y?: number;
}

export const Reveal = ({ children, className, delay = 0, y = 14 }: RevealProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
