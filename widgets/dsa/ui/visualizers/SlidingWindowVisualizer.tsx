'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';

interface SlidingWindowVisualizerProps {
  exampleInput: {
    array: number[];
    k?: number;
    target?: number;
  };
}

export const SlidingWindowVisualizer: React.FC<SlidingWindowVisualizerProps> = ({ exampleInput }) => {
  const { array, k = 3 } = exampleInput;
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSum, setCurrentSum] = useState(0);
  const [maxSum, setMaxSum] = useState(0);
  const [history, setHistory] = useState<{ left: number; right: number; sum: number; maxSum: number }[]>([]);

  const reset = useCallback(() => {
    setLeft(0);
    setRight(0);
    setCurrentSum(0);
    setMaxSum(0);
    setIsPlaying(false);
    setHistory([]);
  }, []);

  const nextStep = useCallback(() => {
    if (right >= array.length) {
      setIsPlaying(false);
      return;
    }

    setHistory(prev => [...prev, { left, right, sum: currentSum, maxSum }]);

    if (right < k) {
      const newSum = currentSum + array[right];
      setCurrentSum(newSum);
      if (right === k - 1) setMaxSum(newSum);
      setRight(prev => prev + 1);
    } else {
      const newSum = currentSum + array[right] - array[left];
      setCurrentSum(newSum);
      setMaxSum(prev => Math.max(prev, newSum));
      setLeft(prev => prev + 1);
      setRight(prev => prev + 1);
    }
  }, [left, right, currentSum, maxSum, array, k]);

  const prevStep = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setLeft(lastState.left);
    setRight(lastState.right);
    setCurrentSum(lastState.sum);
    setMaxSum(lastState.maxSum);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && right < array.length) {
      timer = setTimeout(nextStep, 800);
    } else if (isPlaying) {
      timer = setTimeout(() => setIsPlaying(false), 0);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, nextStep, right, array.length]);

  return (
    <div className="w-full bg-background/50 rounded-xl border border-white/10 p-6 font-mono">
      <div className="flex justify-between items-center mb-8">
        <div className="text-xs uppercase tracking-widest text-foreground-faint">
          Sliding Window Visualizer
        </div>
        <div className="flex gap-2">
          <button onClick={prevStep} disabled={history.length === 0} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30">
            <SkipBack size={16} />
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/5 rounded-lg text-accent">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={nextStep} disabled={right >= array.length} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30">
            <SkipForward size={16} />
          </button>
          <button onClick={reset} className="p-2 hover:bg-white/5 rounded-lg">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-8 h-16 items-end">
        {array.map((num, i) => {
          const isInWindow = i >= left && i < right;

          return (
            <div key={i} className="relative flex flex-col items-center">
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded border transition-all duration-300
                  ${isInWindow ? 'bg-accent/20 border-accent text-accent scale-105 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 
                    'bg-white/5 border-white/10 text-white/40'}
                `}
              >
                {num}
              </div>
              <div className="mt-2 text-[8px] text-foreground-faint">{i}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-4">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-foreground-faint">Window Range:</span>
            <span className="text-accent">[{left}, {Math.max(0, right - 1)}]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-faint">Window Size:</span>
            <span className="text-white">{Math.max(0, right - left)} / {k}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-foreground-faint">Current Sum:</span>
            <span className="text-white font-bold">{currentSum}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-faint">Max Sum Seen:</span>
            <span className="text-accent font-bold">{maxSum}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
