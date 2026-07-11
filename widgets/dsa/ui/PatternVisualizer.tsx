'use client';

import React from 'react';
import { TwoPointersVisualizer } from './visualizers/TwoPointersVisualizer';
import { SlidingWindowVisualizer } from './visualizers/SlidingWindowVisualizer';
import { BinarySearchVisualizer } from './visualizers/BinarySearchVisualizer';

interface PatternVisualizerProps {
  pattern: string;
  exampleInput: Record<string, unknown>;
}

export const PatternVisualizer: React.FC<PatternVisualizerProps> = ({ pattern, exampleInput }) => {
  if (!exampleInput || !Array.isArray(exampleInput.array)) {
    return (
      <div className="w-full aspect-video bg-background/50 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-foreground-faint text-xs font-mono">
        Invalid example input for visualizer.
      </div>
    );
  }

  const array = exampleInput.array as number[];
  const target = typeof exampleInput.target === 'number' ? exampleInput.target : 0;
  const k = typeof exampleInput.k === 'number' ? exampleInput.k : 3;

  switch (pattern.toLowerCase()) {
    case 'two-pointers':
      return <TwoPointersVisualizer exampleInput={{ array, target }} />;
    case 'sliding-window':
      return <SlidingWindowVisualizer exampleInput={{ array, k, target }} />;
    case 'binary-search':
      return <BinarySearchVisualizer exampleInput={{ array, target }} />;
    default:
      return (
        <div className="w-full aspect-video bg-background/50 rounded-xl border border-dashed border-white/10 flex items-center justify-center flex-col gap-2 my-8">
          <div className="text-foreground-faint text-xs font-mono uppercase tracking-widest">
            No visualizer available for pattern: {pattern}
          </div>
          <div className="text-[10px] text-foreground-faint/60 italic">
            Visualizer support is currently limited to two-pointers, sliding-window, and binary-search.
          </div>
        </div>
      );
  }
};
