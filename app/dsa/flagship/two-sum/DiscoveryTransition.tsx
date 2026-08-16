'use client';

import React, { useState, useCallback } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface DiscoveryTransitionProps {
  complexity: string;
  discoveryQuestions: string[];
  /** Rough element count used in the framing text, e.g. the example array's length. */
  exampleSize: number;
}

export const DiscoveryTransition: React.FC<DiscoveryTransitionProps> = ({
  complexity,
  discoveryQuestions,
  exampleSize,
}) => {
  // How many questions are currently revealed (0 = none yet).
  const [revealedCount, setRevealedCount] = useState(0);

  const allRevealed = revealedCount >= discoveryQuestions.length;

  const revealNext = useCallback(() => {
    setRevealedCount(prev => (prev < discoveryQuestions.length ? prev + 1 : prev));
  }, [discoveryQuestions.length]);

  return (
    <div className="w-full bg-surface-raised rounded-xl border border-border p-6 md:p-8">
      {/* Transition moment: complexity callout */}
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-widest text-foreground-faint mb-2">
          Brute-force complexity
        </div>
        <div className="font-mono text-5xl md:text-6xl font-bold text-accent mb-4">
          {complexity}
        </div>
        <p className="text-foreground-muted max-w-xl mx-auto">
          That worked for {exampleSize} elements — but what if the array had 10,000 elements
          instead? The brute-force approach would need roughly 10,000² comparisons in the worst
          case. Let&apos;s think through why, and what could be done differently.
        </p>
      </div>

      {/* Guided discovery questions — revealed one at a time */}
      <div className="space-y-4 mb-10" aria-live="polite">
        {discoveryQuestions.slice(0, revealedCount).map((question, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-sm text-foreground"
          >
            <span className="text-accent font-mono mr-2">Q{i + 1}.</span>
            {question}
          </div>
        ))}
      </div>

      {!allRevealed ? (
        <div className="text-center">
          <button
            onClick={revealNext}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-accent text-accent hover:bg-accent/10 transition-colors font-medium"
          >
            {revealedCount === 0 ? 'Start thinking it through' : 'Next question'}
            <ChevronDown size={16} />
          </button>
          <p className="mt-3 text-xs text-foreground-faint">
            {revealedCount} of {discoveryQuestions.length} questions revealed
          </p>
        </div>
      ) : (
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-foreground-muted mb-4">
            Keep those trade-offs in mind — here&apos;s how the optimized approach handles it.
          </p>
          <button
            disabled
            title="Coming in the next chunk"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-background font-bold rounded-lg text-lg opacity-50 cursor-not-allowed"
          >
            Watch the Optimized Approach
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
