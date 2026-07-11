"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../model/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering client-specific state after mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isDark = theme === "dark";

  if (!mounted) {
    return (
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground-muted">
        <span className="font-mono text-xs" aria-hidden="true">●</span>
      </div>
    );
  }

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
