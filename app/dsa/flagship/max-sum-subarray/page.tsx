import React, { useState, useEffect, useCallback } from 'react';
import { getDSAProblemBySlug, fetchDSATrace, DSATrace } from '@/shared/lib/dsa-sync';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/shared/lib/useReducedMotion';

// Note: Metadata export is not available in client components
// This will be handled by a server-side wrapper if needed

interface ArrayBoxProps {
  value: number;
  index: number;
  delay: number;
  isInWindow: boolean;
}

const ArrayBox: React.FC<ArrayBoxProps> = ({ value, index, delay, isInWindow }) => {
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
      className={`flex flex-col items-center p-4 border rounded-lg shadow-lg transition-all ${
        isInWindow
          ? 'border-accent bg-accent/20 text-accent-foreground'
          : 'border-border bg-surface-raised text-foreground'
      }`}
    >
      <span className="font-mono text-2xl font-bold">{value}</span>
      <span className="font-mono text-sm text-foreground-faint mt-1">[{index}]</span>
    </motion.div>
  );
};

interface VisualizerProps {
  nums: number[];
  trace: DSATrace;
}

const SlidingWindowVisualizer: React.FC<VisualizerProps> = ({ nums, trace }) => {
  const prefersReducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = trace.optimized.steps;
  const currentStepData = steps[currentStep];

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) return;

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsPlaying(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps.length, prefersReducedMotion]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  if (!currentStepData) {
    return <div className="text-center text-foreground-faint">No steps available</div>;
  }



  return (
    <div className="space-y-8">
      {/* Array Visualization */}
      <div className="bg-surface-raised p-8 rounded-lg shadow-xl border border-border">
        <h3 className="text-xl font-bold text-foreground mb-6">Array Visualization</h3>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {nums.map((num, index) => (
            <ArrayBox
              key={index}
              value={num}
              index={index}
              delay={index * 0.1}
              isInWindow={
                currentStepData.highlightIndices?.includes(index) ?? false
              }
            />
          ))}
        </div>
      </div>

      {/* Step Information */}
      <div className="bg-surface-raised p-8 rounded-lg shadow-xl border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">Step Information</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground-faint mb-2">Explanation:</p>
            <p className="text-lg text-foreground">{currentStepData.explanation}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground-faint mb-1">window_sum</p>
              <p className="text-2xl font-mono font-bold text-accent">
                {String(currentStepData.variables.window_sum)}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-faint mb-1">max_sum</p>
              <p className="text-2xl font-mono font-bold text-accent">
                {String(currentStepData.variables.max_sum)}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-faint mb-1">window_start</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {String(currentStepData.variables.window_start)}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-faint mb-1">window_end</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {String(currentStepData.variables.window_end)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface-raised p-8 rounded-lg shadow-xl border border-border">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-border text-foreground rounded-lg hover:bg-border/80 transition-colors font-semibold"
            aria-label="Reset to start"
          >
            ⏮ Reset
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-border text-foreground rounded-lg hover:bg-border/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            aria-label="Previous step"
          >
            ◀ Prev
          </button>
          <button
            onClick={handlePlayPause}
            className="px-8 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className="px-6 py-3 bg-border text-foreground rounded-lg hover:bg-border/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            aria-label="Next step"
          >
            Next ▶
          </button>
        </div>
        <div className="mt-4 text-center text-foreground-faint">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* Code Display */}
      <div className="bg-surface-raised p-8 rounded-lg shadow-xl border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">Optimized Solution (O(N))</h3>
        <pre className="bg-surface p-4 rounded overflow-x-auto text-sm text-foreground-faint font-mono">
          {trace.optimized.code.map((line, idx) => (
            <div
              key={idx}
              className={
                idx + 1 === currentStepData.line
                  ? 'bg-accent/20 text-accent-foreground'
                  : ''
              }
            >
              {`${idx + 1}  ${line}`}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

async function MaxSumSubarrayPageContent() {
  const problem = await getDSAProblemBySlug('sliding-window', 'max-sum-subarray');
  const trace = await fetchDSATrace('sliding-window', 'max-sum-subarray');

  if (!problem || !trace) {
    return (
      <div className="container mx-auto py-12 text-center text-foreground-faint">
        <h1 className="text-4xl font-bold mb-4">Problem Not Found</h1>
        <p>Could not load the Maximum Sum Subarray problem or its trace data. Please check the configuration.</p>
      </div>
    );
  }

  const nums = [2, 1, 5, 1, 3, 2];

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-accent mb-6">{problem.title}</h1>
      <div className="prose prose-invert max-w-none mb-12">
        <MDXRemote source={problem.writeup} />
      </div>

      <div className="bg-surface-raised p-8 rounded-lg shadow-xl border border-border mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Example Input</h2>
        <div className="flex flex-col space-y-6">
          <div>
            <p className="text-lg text-foreground-faint mb-2">Array (nums):</p>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {nums.map((num, index) => (
                <div key={index} className="flex flex-col items-center p-4 border border-border rounded-lg bg-surface shadow-lg">
                  <span className="font-mono text-2xl text-foreground">{num}</span>
                  <span className="font-mono text-sm text-foreground-faint mt-1">[{index}]</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-lg text-foreground-faint mb-2">Window Size (k):</p>
            <div className="p-4 border border-accent rounded-lg bg-surface-raised shadow-lg inline-block">
              <span className="font-mono text-2xl text-accent-foreground font-bold">{3}</span>
            </div>
          </div>
        </div>
      </div>

      <SlidingWindowVisualizer nums={nums} trace={trace} />
    </div>
  );
}

export default async function MaxSumSubarrayPage() {
  return <MaxSumSubarrayPageContent />;
}
