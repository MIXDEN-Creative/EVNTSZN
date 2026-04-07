"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type HoverLiftProps = {
  children: ReactNode;
  className?: string;
};

export default function HoverLift({ children, className = "" }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
