// components/motion/FillPanel.tsx
// The signature "colour fill": a solid panel that wipes upward with colour
// as it scrolls into view, then the content fades in on top of it.
// Used for the forest-green balance banner and section highlights.
"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface FillPanelProps {
  children: ReactNode;
  className?: string;
  /** Fill layer classes, e.g. "bg-forest" or "bg-terracotta-dark". */
  fill?: string;
}

export const FillPanel = ({ children, className = "", fill = "bg-forest" }: FillPanelProps) => {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={`${fill} ${className}`}>{children}</div>;
  }
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
    >
      <motion.span
        aria-hidden="true"
        className={`absolute inset-0 ${fill}`}
        style={{ transformOrigin: "bottom" }}
        variants={{
          hidden: { scaleY: 0 },
          show: {
            scaleY: 1,
            transition: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
          },
        }}
      />
      <motion.div
        className="relative"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { delay: 0.22, duration: 0.35 } },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
