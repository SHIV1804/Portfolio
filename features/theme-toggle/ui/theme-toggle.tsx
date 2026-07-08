"use client";

import { useTheme } from "../model/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors hover:text-foreground hover:border-border-strong"
    >
      <span className="font-mono text-xs" aria-hidden="true">
        {isDark ? "○" : "●"}
      </span>
    </button>
  );
}
