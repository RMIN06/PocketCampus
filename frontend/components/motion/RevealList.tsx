// components/motion/RevealList.tsx
// Stagger container: wrap each child in <RevealItem> and they cascade in
// on scroll with a calm, even rhythm. Static under reduced motion.
"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export const revealItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface RevealListProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each item. */
  interval?: number;
}

export const RevealList = ({ children, className, interval = 0.06 }: RevealListProps) => {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: interval } } }}
    >
      {children}
    </motion.div>
  );
};

export const RevealItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div className={className} variants={revealItem}>
    {children}
  </motion.div>
);
