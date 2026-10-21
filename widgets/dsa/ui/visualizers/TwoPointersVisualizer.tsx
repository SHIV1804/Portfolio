'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { useReducedMotion } from '@/shared/lib/useReducedMotion';

interface TwoPointersVisualizerProps {
  exampleInput: {
    array: number[];
    target: number;
  };
}

const CELL_STEP = 48;

export const TwoPointersVisualizer: React.FC<TwoPointersVisualizerProps> = ({ exampleInput }) => {
  const { array, target } = exampleInput;
  const prefersReducedMotion = useReducedMotion();
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(array.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [found, setFound] = useState(false);
  const [history, setHistory] = useState<{ left: number; right: number }[]>([]);
  const transition = { duration: prefersReducedMotion ? 0 : 0.35, ease: 'easeOut' as const };

  const reset = useCallback(() => {
    setLeft(0);
    setRight(array.length - 1);
    setFound(false);
    setIsPlaying(false);
    setHistory([]);
  }, [array.length]);

  const nextStep = useCallback(() => {
    if (left >= right || found) {
      setIsPlaying(false);
      return;
    }

    const currentSum = array[left] + array[right];
    setHistory(prev => [...prev, { left, right }]);

    if (currentSum === target) {
      setFound(true);
      setIsPlaying(false);
    } else if (currentSum < target) {
      setLeft(prev => prev + 1);
    } else {
      setRight(prev => prev - 1);
    }
  }, [left, right, found, array, target]);

  const prevStep = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setLeft(lastState.left);
    setRight(lastState.right);
    setHistory(prev => prev.slice(0, -1));
    setFound(false);
  }, [history]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !found && left < right) {
      timer = setTimeout(nextStep, 800);
    } else if (isPlaying) {
      timer = setTimeout(() => setIsPlaying(false), 0);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, nextStep, found, left, right]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
      if (e.key === ' ') setIsPlaying(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, prevStep]);

  return (
    <div className="w-full bg-background/50 rounded-xl border border-white/10 p-6 font-mono">
      <div className="flex justify-between items-center mb-8">
        <div className="text-xs uppercase tracking-widest text-foreground-faint">Two Pointers Visualizer</div>
        <div className="flex gap-2">
          <button onClick={prevStep} disabled={history.length === 0} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30"><SkipBack size={16} /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/5 rounded-lg text-accent">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
          <button onClick={nextStep} disabled={left >= right || found} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30"><SkipForward size={16} /></button>
          <button onClick={reset} className="p-2 hover:bg-white/5 rounded-lg"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="relative flex justify-center gap-2 mb-8 h-16 items-end">
        {array.map((num, i) => {
          const isLeft = i === left;
          const isRight = i === right;
          const isMatch = found && (isLeft || isRight);
          return (
            <div key={i} className="relative flex flex-col items-center group">
              <motion.div
                className={`w-10 h-10 flex items-center justify-center rounded border ${isMatch ? 'bg-green-500/20 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : (isLeft || isRight) ? 'bg-accent/20 border-accent text-accent' : 'bg-white/5 border-white/10 text-white/40'}`}
                animate={{ scale: isMatch ? 1.1 : 1, opacity: isMatch ? 1 : 0.9 }}
                transition={transition}
              >{num}</motion.div>
              <div className="mt-2 text-[8px] text-foreground-faint">{i}</div>
            </div>
          );
        })}
        <motion.div className="pointer-events-none absolute -top-8 left-0 h-5 w-full" aria-hidden="true">
          <motion.span className="absolute -translate-x-1/2 text-[10px] font-bold text-accent" animate={{ x: left * CELL_STEP + 20 }} transition={transition}>LEFT</motion.span>
          <motion.span className="absolute -translate-x-1/2 text-[10px] font-bold text-amber-400" animate={{ x: right * CELL_STEP + 20 }} transition={transition}>RIGHT</motion.span>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-4">
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-foreground-faint">Left Pointer:</span><span className="text-accent">Index {left} (Value: {array[left]})</span></div>
          <div className="flex justify-between"><span className="text-foreground-faint">Right Pointer:</span><span className="text-amber-400">Index {right} (Value: {array[right]})</span></div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-foreground-faint">Current Sum:</span><span className={found ? 'text-green-500 font-bold' : 'text-white'}>{array[left] + array[right]}</span></div>
          <div className="flex justify-between"><span className="text-foreground-faint">Target:</span><span className="text-white">{target}</span></div>
        </div>
      </div>

      {found && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="mt-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-center text-green-500 text-xs">MATCH FOUND: Indices {left + 1} and {right + 1} (1-indexed)</motion.div>}
    </div>
  );
};
