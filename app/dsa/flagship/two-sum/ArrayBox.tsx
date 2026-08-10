'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/shared/lib/useReducedMotion';

interface ArrayBoxProps {
  value: number;
  index: number;
  delay: number;
}

export const ArrayBox: React.FC<ArrayBoxProps> = ({ value, index, delay }) => {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : delay }}
      className="flex flex-col items-center p-4 border border-accent rounded-lg bg-surface-raised shadow-lg"
    >
      <span className="font-mono text-2xl text-accent-foreground">{value}</span>
      <span className="font-mono text-sm text-foreground-faint mt-1">[{index}]</span>
    </motion.div>
  );
};
