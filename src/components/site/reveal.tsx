"use client";

import { motion } from "motion/react";

/**
 * Section reveal: 32px rise + fade, triggered once when ~15% visible.
 * (Added motion — mural.co's sections are mostly static; see reference audit.)
 * Reduced motion is handled globally by <MotionConfig reducedMotion="user">.
 */
export function Reveal({ children, delay = 0, className, as = "div", y = 32 }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li"; y?: number }) {
  const M = as === "section" ? motion.section : as === "li" ? motion.li : motion.div;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay }}
    >
      {children}
    </M>
  );
}
