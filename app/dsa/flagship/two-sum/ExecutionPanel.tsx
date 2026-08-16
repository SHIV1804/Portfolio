'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { useReducedMotion } from '@/shared/lib/useReducedMotion';
import { ArrayBox } from './ArrayBox';
import type { DSATracePhase, DSAPredictionQuestion } from '@/shared/lib/dsa-sync';

interface ExecutionPanelProps {
  phase: DSATracePhase;
  nums: number[];
  /** Label used for the panel heading, e.g. "Brute-Force Walkthrough". */
  title: string;
  /** Which phase this panel represents, used to filter predictionQuestions by their `phase` field. */
  phaseKey: 'bruteForce' | 'optimized';
  /** Full prediction-questions list from the trace; filtered internally by phaseKey. */
  predictionQuestions?: DSAPredictionQuestion[];
}

const AUTOPLAY_INTERVAL_MS = 1800;

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  phase,
  nums,
  title,
  phaseKey,
  predictionQuestions = [],
}) => {
  const { code, steps } = phase;
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // Which gated steps have been answered, and what was picked.
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const questionByStep = React.useMemo(() => {
    const map = new Map<number, DSAPredictionQuestion>();
    for (const q of predictionQuestions) {
      if (q.phase === phaseKey) map.set(q.stepIndex, q);
    }
    return map;
  }, [predictionQuestions, phaseKey]);

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const currentQuestion = questionByStep.get(stepIndex);
  const isAnswered = currentQuestion ? stepIndex in answers : true;
  // A gated step hides its real state (array/code/variables/explanation)
  // until the user picks an answer.
  const isGated = !!currentQuestion && !isAnswered;

  const stepForward = useCallback(() => {
    if (isGated) return;
    setStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
  }, [steps.length, isGated]);

  const stepBack = useCallback(() => {
    setStepIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const reset = useCallback(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setAnswers({});
  }, []);

  const togglePlay = useCallback(() => {
    // Reduced-motion users get manual stepping only — never force autoplay on them.
    if (prefersReducedMotion || isGated) return;
    setIsPlaying(prev => {
      if (!prev && isLastStep) {
        setStepIndex(0);
        return true;
      }
      return !prev;
    });
  }, [prefersReducedMotion, isLastStep, isGated]);

  const answerQuestion = useCallback(
    (optionIndex: number) => {
      setAnswers(prev => ({ ...prev, [stepIndex]: optionIndex }));
    },
    [stepIndex]
  );

  // Autoplay loop. setIsPlaying(false) below runs inside the timeout callback
  // (deferred/async), not synchronously in the effect body, so it does not
  // trigger cascading renders. Landing on a gated (unanswered) step also
  // pauses playback so the user has to engage with the question.
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || isLastStep) return;

    if (isGated) {
      // Deferred (not called synchronously in the effect body) to satisfy
      // react-hooks/set-state-in-effect, same pattern as the branch below.
      const gateTimer = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(gateTimer);
    }

    const timer = setTimeout(() => {
      setStepIndex(prev => {
        const next = prev < steps.length - 1 ? prev + 1 : prev;
        if (next >= steps.length - 1) {
          setIsPlaying(false);
        }
        return next;
      });
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isPlaying, isLastStep, stepIndex, prefersReducedMotion, steps.length, isGated]);

  // Keyboard controls — scoped to when this panel (or its children) has focus
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          stepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepBack();
          break;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          togglePlay();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          reset();
          break;
        default:
          break;
      }
    };

    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [stepForward, stepBack, togglePlay, reset]);

  if (!currentStep) return null;

  const highlightSet = new Set(currentStep.highlightIndices ?? []);
  const highlightedCodeLine = currentStep.line;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label={`${title} — step ${stepIndex + 1} of ${steps.length}`}
      className="w-full bg-surface-raised rounded-xl border border-border p-6 md:p-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-foreground-faint mb-1">
            {title}
          </div>
          <div className="text-sm text-foreground-muted">
            Step {stepIndex + 1} of {steps.length}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={stepBack}
            disabled={isFirstStep}
            aria-label="Step back"
            className="p-2 rounded-lg border border-border hover:bg-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlay}
            disabled={prefersReducedMotion || isGated}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={prefersReducedMotion ? 'Autoplay disabled (reduced motion preferred)' : undefined}
            className="p-2 rounded-lg border border-accent text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={stepForward}
            disabled={isLastStep || isGated}
            aria-label="Step forward"
            className="p-2 rounded-lg border border-border hover:bg-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward size={16} />
          </button>
          <button
            onClick={reset}
            aria-label="Reset"
            className="p-2 rounded-lg border border-border hover:bg-border/30 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {currentQuestion && (
        <div
          className="mb-8 p-5 rounded-lg border border-accent/40 bg-accent/10"
          data-testid="prediction-question"
        >
          <div className="text-xs uppercase tracking-widest text-accent mb-2">Predict</div>
          <p className="text-sm text-foreground mb-4">{currentQuestion.question}</p>
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option, i) => {
              const picked = answers[stepIndex];
              const hasAnswered = picked !== undefined;
              const isCorrectOption = i === currentQuestion.correctOptionIndex;
              const isPickedOption = picked === i;

              let optionClasses =
                'text-left px-4 py-2 rounded-lg border text-sm transition-colors ';
              if (!hasAnswered) {
                optionClasses += 'border-border hover:border-accent hover:bg-accent/10';
              } else if (isCorrectOption) {
                optionClasses += 'border-green-600/60 bg-green-600/10 text-foreground';
              } else if (isPickedOption) {
                optionClasses += 'border-red-600/60 bg-red-600/10 text-foreground';
              } else {
                optionClasses += 'border-border opacity-50';
              }

              return (
                <button
                  key={i}
                  onClick={() => !hasAnswered && answerQuestion(i)}
                  disabled={hasAnswered}
                  className={optionClasses}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {stepIndex in answers && (
            <p className="mt-3 text-sm font-medium">
              {answers[stepIndex] === currentQuestion.correctOptionIndex ? (
                <span className="text-green-500">Correct!</span>
              ) : (
                <span className="text-red-500">
                  Not quite — the correct answer is highlighted above.
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {isGated ? (
        <div className="text-center text-sm text-foreground-faint py-8">
          Answer the question above to reveal this step.
        </div>
      ) : (
        <>
          {/* Array visualization */}
          <div className="flex justify-center gap-4 mb-8">
            {nums.map((num, index) => (
              <div
                key={index}
                className={`rounded-lg transition-shadow duration-300 ${
                  highlightSet.has(index) ? 'ring-2 ring-accent shadow-[0_0_16px_rgba(232,163,61,0.35)]' : ''
                }`}
              >
                <ArrayBox value={num} index={index} delay={0} />
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Code panel */}
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2 text-xs uppercase tracking-widest text-foreground-faint border-b border-border">
                Code
              </div>
              <pre className="font-mono text-sm leading-6 overflow-x-auto">
                {code.map((line, i) => {
                  const lineNumber = i + 1;
                  const isActive = lineNumber === highlightedCodeLine;
                  return (
                    <div
                      key={i}
                      className={`px-4 flex ${
                        isActive ? 'bg-accent/15 border-l-2 border-accent' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <span className="w-6 shrink-0 text-foreground-faint select-none">{lineNumber}</span>
                      <span className={isActive ? 'text-accent-strong' : 'text-foreground-muted'}>
                        {line || '\u00A0'}
                      </span>
                    </div>
                  );
                })}
              </pre>
            </div>

            {/* Variable tracker */}
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2 text-xs uppercase tracking-widest text-foreground-faint border-b border-border">
                Variables
              </div>
              <div className="p-4 space-y-2 font-mono text-sm">
                {Object.entries(currentStep.variables).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-foreground-faint">{key}</span>
                    <span className="text-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>

              {currentStep.mapState && (
                <div className="border-t border-accent/30">
                  <div className="px-4 py-2 text-xs uppercase tracking-widest text-accent bg-accent/10">
                    Map
                  </div>
                  <div className="p-4 font-mono text-sm">
                    {Object.keys(currentStep.mapState).length === 0 ? (
                      <span className="text-foreground-faint">{'{ }'}</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(currentStep.mapState).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 rounded bg-accent/15 border border-accent/30 text-foreground"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/30 text-sm text-foreground">
            {currentStep.explanation}
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-foreground-faint text-center">
        Use ← / → to step, space to play/pause, R to reset.
      </p>
    </div>
  );
};
