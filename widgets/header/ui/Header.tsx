"use client";

import React from "react";
import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/shared/config/site";
import { ThemeToggle } from "@/features/theme-toggle";
import { CommandPalette } from "@/widgets/command-palette/ui/CommandPalette";
import { Search } from "lucide-react";

export const Header: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
        </div>
      </div>
      <CommandPalette open={isCommandPaletteOpen} setOpen={setIsCommandPaletteOpen} />
    </header>
  );
};
