'use client';

import { useEffect, useRef } from 'react';
import { useTerminal } from '../model/useTerminal';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Terminal({ isOpen, onClose }: TerminalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { input, setInput, output, handleKeyDown } = useTerminal(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Terminal Easter Egg"
    >
      <div className="w-full max-w-4xl h-[70vh] bg-surface border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden font-mono text-sm">
        {/* Header */}
        <div className="bg-surface-raised border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <span className="text-[10px] text-foreground-faint uppercase tracking-widest">
            shivam@sandbox: ~
          </span>
          <button 
            onClick={onClose}
            className="text-foreground-faint hover:text-accent transition-colors"
            aria-label="Close terminal"
          >
            [ESC]
          </button>
        </div>

        {/* Content */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin scrollbar-thumb-border"
          onClick={() => inputRef.current?.focus()}
        >
          {output.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-words">
              {line.type === 'input' ? (
                <div className="flex gap-2">
                  <span className="text-accent font-bold">$</span>
                  <span>{line.content}</span>
                </div>
              ) : (
                <div className="text-foreground-muted">{line.content}</div>
              )}
            </div>
          ))}
          
          {/* Active Input */}
          <div className="flex gap-2 items-center">
            <span className="text-accent font-bold">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-foreground caret-transparent"
              spellCheck="false"
              autoComplete="off"
            />
            <span className="cursor-blink" />
          </div>
        </div>
      </div>
    </div>
  );
}
