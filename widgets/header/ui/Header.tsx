"use client";

import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { siteConfig } from "@/shared/config/site";
import { ThemeToggle } from "@/features/theme-toggle";
import { CommandPalette } from "@/widgets/command-palette/ui/CommandPalette";
import { Search, Menu, X } from "lucide-react";

export const Header: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isMobileMenuOpen]);

  // Focus management for accessibility
  useEffect(() => {
    if (isMobileMenuOpen) {
      mobileMenuRef.current?.focus();
    }
  }, [isMobileMenuOpen]);

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight hover:text-accent transition-colors">
            {siteConfig.name}
            <span className="text-accent ml-1">_</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface-raised hover:border-accent transition-colors group"
            aria-label="Open command palette"
          >
            <Search className="w-4 h-4 text-foreground-faint group-hover:text-accent" />
            <span className="hidden sm:inline text-xs font-medium text-foreground-muted group-hover:text-foreground">
              Search...
            </span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border-strong bg-surface text-[10px] font-mono text-foreground-faint">
              <span className="text-[8px]">⌘</span>K
            </kbd>
          </button>
          <ThemeToggle />
          
          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-md border border-border hover:border-accent transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-nav"
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {/* Home link */}
            <Link
              href="/"
              className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors py-2 px-2 rounded hover:bg-surface"
              onClick={handleNavClick}
            >
              {siteConfig.name}
            </Link>
            
            {/* Navigation links */}
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors py-2 px-2 rounded hover:bg-surface"
                onClick={handleNavClick}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <CommandPalette open={isCommandPaletteOpen} setOpen={setIsCommandPaletteOpen} />
    </header>
  );
};
