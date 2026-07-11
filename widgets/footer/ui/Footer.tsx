'use client';

import React, { useState, useEffect } from "react";
import { siteConfig } from "@/shared/config/site";
import { Terminal } from "@/widgets/terminal-easter-egg";
import { Terminal as TerminalIcon } from "lucide-react";

export const Footer: React.FC = () => {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setIsTerminalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <footer className="w-full border-t border-border bg-surface-raised py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h3 className="font-bold text-foreground">{siteConfig.name}</h3>
            <p className="text-sm text-foreground-muted max-w-xs">
              {siteConfig.description}
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-6">
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground-muted hover:text-accent transition-colors"
              >
                GitHub
              </a>
              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground-muted hover:text-accent transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={siteConfig.links.email}
                className="text-sm font-medium text-foreground-muted hover:text-accent transition-colors"
              >
                Email
              </a>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-foreground-faint font-mono">
                &copy; {currentYear} {siteConfig.name}. All rights reserved.
              </p>
              <button
                onClick={() => setIsTerminalOpen(true)}
                className="p-2 text-foreground-faint hover:text-accent transition-colors rounded-lg hover:bg-surface"
                aria-label="Open terminal easter egg"
                data-testid="terminal-trigger"
              >
                <TerminalIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Terminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />
    </footer>
  );
};
