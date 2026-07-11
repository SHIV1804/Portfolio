'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';

interface BinarySearchVisualizerProps {
  exampleInput: {
    array: number[];
    target: number;
  };
}

export const BinarySearchVisualizer: React.FC<BinarySearchVisualizerProps> = ({ exampleInput }) => {
  const { array, target } = exampleInput;
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(array.length - 1);
  const [mid, setMid] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [found, setFound] = useState(false);
  const [history, setHistory] = useState<{ low: number; high: number; mid: number }[]>([]);

  const reset = useCallback(() => {
    setLow(0);
    setHigh(array.length - 1);
    setMid(-1);
    setFound(false);
    setIsPlaying(false);
    setHistory([]);
  }, [array.length]);

  const nextStep = useCallback(() => {
    if (low > high || found) {
      setIsPlaying(false);
      return;
    }

    const currentMid = Math.floor((low + high) / 2);
    setHistory(prev => [...prev, { low, high, mid: currentMid }]);
    setMid(currentMid);

    if (array[currentMid] === target) {
      setFound(true);
      setIsPlaying(false);
    } else if (array[currentMid] < target) {
      setLow(currentMid + 1);
    } else {
      setHigh(currentMid - 1);
    }
  }, [low, high, found, array, target]);

  const prevStep = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setLow(lastState.low);
    setHigh(lastState.high);
    setMid(lastState.mid);
    setHistory(prev => prev.slice(0, -1));
    setFound(false);
  }, [history]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !found && low <= high) {
      timer = setTimeout(nextStep, 1000);
    } else if (isPlaying) {
      timer = setTimeout(() => setIsPlaying(false), 0);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, nextStep, found, low, high]);

  return (
    <div className="w-full bg-background/50 rounded-xl border border-white/10 p-6 font-mono">
      <div className="flex justify-between items-center mb-8">
        <div className="text-xs uppercase tracking-widest text-foreground-faint">
          Binary Search Visualizer
        </div>
        <div className="flex gap-2">
          <button onClick={prevStep} disabled={history.length === 0} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30">
            <SkipBack size={16} />
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/5 rounded-lg text-accent">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={nextStep} disabled={low > high || found} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-30">
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
          const isMatch = found && isMid;

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
              {mid === -1 ? '-' : `${array[mid]} ${array[mid] === target ? '=' : array[mid] < target ? '<' : '>'} ${target}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-faint">Status:</span>
            <span className={found ? 'text-green-500 font-bold' : 'text-white'}>
              {found ? 'FOUND' : low > high ? 'NOT FOUND' : 'SEARCHING...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
