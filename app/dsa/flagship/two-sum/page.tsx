import React from 'react';
import { Metadata } from 'next';
import { getDSAProblemBySlug, fetchDSATrace } from '@/shared/lib/dsa-sync';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/shared/lib/useReducedMotion';

export const metadata: Metadata = {
  title: 'Two Sum Interactive Walkthrough | DSA Flagship',
  description: 'An interactive walkthrough of the Two Sum problem, demonstrating brute-force and optimized solutions visually.',
};

interface ArrayBoxProps {
  value: number;
  index: number;
  delay: number;
}

const ArrayBox: React.FC<ArrayBoxProps> = ({ value, index, delay }) => {
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

export default async function TwoSumFlagshipPage() {
  const problem = await getDSAProblemBySlug('hash-map', 'two-sum');
  const trace = await fetchDSATrace('hash-map', 'two-sum');

  if (!problem || !trace) {
    return (
      <div className="container mx-auto py-12 text-center text-foreground-faint">
        <h1 className="text-4xl font-bold mb-4">Problem Not Found</h1>
        <p>Could not load the Two Sum problem or its trace data. Please check the configuration.</p>
      </div>
    );
  }

  const nums = [3, 2, 4]; // Hardcoded for this specific example
  const target = 6; // Hardcoded for this specific example

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-accent mb-6">{problem.title}</h1>
      <div className="prose prose-invert max-w-none mb-12">
        <MDXRemote source={problem.writeup} />
      </div>

      <div className="bg-surface-raised p-8 rounded-lg shadow-xl border border-border mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Example Input</h2>
        <div className="flex items-center space-x-8">
          <div>
            <p className="text-lg text-foreground-faint mb-2">Array (nums):</p>
            <div className="flex space-x-4">
              {nums.map((num, index) => (
                <ArrayBox key={index} value={num} index={index} delay={index * 0.1} />
              ))}
            </div>
          </div>
          <div className="text-3xl font-bold text-accent">+
          </div>
          <div>
            <p className="text-lg text-foreground-faint mb-2">Target:</p>
            <div className="p-4 border border-accent rounded-lg bg-surface-raised shadow-lg">
              <span className="font-mono text-2xl text-accent-foreground">{target}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-16">
        <button
          disabled
          className="px-8 py-4 bg-accent text-accent-foreground font-bold rounded-lg text-lg opacity-50 cursor-not-allowed"
        >
          Watch the Brute-Force Attempt &rarr;
        </button>
      </div>
    </div>
  );
}
