"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";

const EASE_CURVE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function LandingMotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function HeroReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.055,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0.01, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.38,
            delay,
            ease: EASE_CURVE,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some" }}
      transition={{
        duration: 0.42,
        delay,
        ease: EASE_CURVE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
