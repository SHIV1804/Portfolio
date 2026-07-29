'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';

import { DSATracePhase, DSATraceStep } from '@/shared/lib/dsa-sync';
import { useReducedMotion } from '@/shared/lib/useReducedMotion';

interface BinarySearchVisualizerProps {
  trace?: DSATracePhase;
  initialArray?: number[];
  target?: number;
  // Legacy support
  exampleInput?: {
    array: number[];
    target: number;
  };
}

export const BinarySearchVisualizer: React.FC<BinarySearchVisualizerProps> = ({
  trace,
  initialArray,
  target,
  exampleInput,
}) => {
  // Handle legacy mode if trace is not provided
  const array = initialArray || exampleInput?.array || [];
  const finalTarget = target ?? exampleInput?.target ?? 0;

  // If in legacy mode (no trace), we'll use a simplified internal state machine
  // but for the flagship experience, we expect the trace.
  const isFlagship = !!trace;
  const prefersReducedMotion = useReducedMotion();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [legacyLow, setLegacyLow] = useState(0);
  const [legacyHigh, setLegacyHigh] = useState(array.length - 1);
  const [legacyMid, setLegacyMid] = useState(-1);
  const [legacyFound, setLegacyFound] = useState(false);

  const currentStep: DSATraceStep | undefined = trace?.steps[currentStepIndex];
  
  const low = isFlagship ? (currentStep?.variables.low as number) : legacyLow;
  const high = isFlagship ? (currentStep?.variables.high as number) : legacyHigh;
  const mid = isFlagship ? (currentStep?.variables.mid as number) : legacyMid;
  const isFound = isFlagship ? (currentStep?.variables.found as boolean) : legacyFound;
  const isNotFound = isFlagship 
    ? (trace && currentStepIndex === trace.steps.length - 1 && !isFound) 
    : (legacyLow > legacyHigh && !legacyFound);

  const reset = useCallback(() => {
    if (isFlagship) {
      setCurrentStepIndex(0);
    } else {
      setLegacyLow(0);
      setLegacyHigh(array.length - 1);
      setLegacyMid(-1);
      setLegacyFound(false);
    }
    setIsPlaying(false);
  }, [isFlagship, array.length]);

  const nextStep = useCallback(() => {
    if (isFlagship && trace) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, trace.steps.length - 1));
    } else if (!isFlagship) {
      if (legacyLow > legacyHigh || legacyFound) {
        setIsPlaying(false);
        return;
      }
      const currentMid = Math.floor((legacyLow + legacyHigh) / 2);
      setLegacyMid(currentMid);
      if (array[currentMid] === finalTarget) {
        setLegacyFound(true);
        setIsPlaying(false);
      } else if (array[currentMid] < finalTarget) {
        setLegacyLow(currentMid + 1);
      } else {
        setLegacyHigh(currentMid - 1);
      }
    }
  }, [isFlagship, trace, legacyLow, legacyHigh, legacyFound, array, finalTarget]);

  const prevStep = useCallback(() => {
    if (isFlagship) {
      setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    }
    // Legacy prevStep not implemented for simplicity
  }, [isFlagship]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const canContinue = isFlagship 
      ? (trace && currentStepIndex < trace.steps.length - 1)
      : (!legacyFound && legacyLow <= legacyHigh);

    if (isPlaying && canContinue) {
      timer = setTimeout(nextStep, prefersReducedMotion ? 0 : 1000);
    } else if (isPlaying) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, nextStep, trace, prefersReducedMotion, isFlagship, legacyFound, legacyLow, legacyHigh]);

  return (
    <div className="w-full bg-background/50 rounded-xl border border-white/10 p-6 font-mono">
      <div className="flex justify-between items-center mb-8">
        <div className="text-xs uppercase tracking-widest text-foreground-faint">
          Binary Search Visualizer
        </div>
        <div className="flex gap-2">
          <button onClick={prevStep} disabled={isFlagship ? currentStepIndex === 0 : true} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30">
            <SkipBack size={16} />
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/5 rounded-lg text-accent">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={nextStep} disabled={isFlagship ? (trace && currentStepIndex === trace.steps.length - 1) : (legacyFound || legacyLow > legacyHigh)} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30">
            <SkipForward size={16} />
          </button>
          <button onClick={reset} className="p-2 hover:bg-white/5 rounded-lg">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-8 h-16 items-end">
        {array.map((num, i) => {
          const isLow = i === low;
          const isHigh = i === high;
          const isMid = i === mid;
          const isExcluded = i < low || i > high;
          const isMatch = isFound && isMid;

          return (
            <div key={i} className="relative flex flex-col items-center">
              {isMid && (
                <div className="absolute -top-8 text-[10px] font-bold text-accent animate-bounce">
                  MID
                </div>
              )}
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded border transition-all duration-300
                  ${isMatch ? 'bg-green-500/20 border-green-500 text-green-500 scale-110 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 
                    isMid ? 'bg-accent/20 border-accent text-accent' : 
                    (isLow || isHigh) ? 'bg-amber-400/20 border-amber-400/40 text-amber-400/60' :
                    isExcluded ? 'opacity-20 grayscale scale-90' :
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
            <span className="text-foreground-faint">Search Range:</span>
            <span className="text-white">[{low}, {high}]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-faint">Midpoint:</span>
            <span className="text-accent">{mid === -1 ? '-' : `Index ${mid} (Val: ${array[mid]})`}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-foreground-faint">Comparison:</span>
            <span className="text-white">
              {mid === -1 ? '-' : `${array[mid]} ${array[mid] === finalTarget ? '=' : array[mid] < finalTarget ? '<' : '>'} ${finalTarget}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-faint">Status:</span>
            <span className={isFound ? 'text-green-500 font-bold' : isNotFound ? 'text-red-500 font-bold' : 'text-white'}>
              {isFound ? 'FOUND' : isNotFound ? 'NOT FOUND' : 'SEARCHING...'}
            </span>
          </div>
        </div>
      </div>
      {currentStep?.explanation && (
        <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-center text-blue-500 text-xs">
          {currentStep.explanation}
        </div>
      )}
    </div>
  );
};
