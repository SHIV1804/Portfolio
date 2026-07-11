'use client';

import { useState, useEffect, useCallback } from 'react';
import { commandRegistry } from '../lib/commands';
import { useTheme } from '@/features/theme-toggle';

const HISTORY_STORAGE_KEY = 'terminal-history';

export function useTerminal(isOpen: boolean, onClose: () => void) {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState<{ type: 'input' | 'output'; content: string }[]>([
    { type: 'output', content: 'Welcome to Shivam Terminal v1.0.0\nType "help" for available commands.' }
  ]);
  const [input, setInput] = useState('');
  const { setTheme } = useTheme();

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      const frame = requestAnimationFrame(() => setHistory(JSON.parse(saved)));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const executeCommand = useCallback(async (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) return;

    // Add to history
    setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 50));
    setHistoryIndex(-1);

    // Add input to output
    setOutput(prev => [...prev, { type: 'input', content: trimmed }]);

    const [name, ...args] = trimmed.split(/\s+/);
    const command = commandRegistry[name.toLowerCase()];

    if (command) {
      const result = await command.handler(args);
      
      if (result === 'CLEAR_TERMINAL') {
        setOutput([]);
      } else if (result === 'EXIT_TERMINAL') {
        onClose();
      } else if (result.startsWith('SET_THEME_')) {
        const theme = result.replace('SET_THEME_', '').toLowerCase() as 'light' | 'dark';
        setTheme(theme);
        setOutput(prev => [...prev, { type: 'output', content: `Theme set to ${theme}.` }]);
      } else {
        setOutput(prev => [...prev, { type: 'output', content: result }]);
      }
    } else {
      setOutput(prev => [...prev, { type: 'output', content: `command not found: ${name}` }]);
    }
  }, [onClose, setTheme]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const commands = Object.keys(commandRegistry);
      const matches = commands.filter(c => c.startsWith(input.toLowerCase()));
      if (matches.length === 1) {
        setInput(matches[0]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return {
    input,
    setInput,
    output,
    handleKeyDown,
    executeCommand
  };
}
