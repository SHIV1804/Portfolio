"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  User,
  Code,
  Briefcase,
  Layers,
  FileText,
  ExternalLink,
  Download,
  Copy,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { siteConfig } from "@/shared/config/site";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, setOpen }) => {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setTheme(isDark ? "dark" : "light");
  };

  const copyEmail = () => {
    const email = siteConfig.links.email.replace("mailto:", "");
    navigator.clipboard.writeText(email);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-background/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-4 h-4 text-foreground-faint mr-3" />
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full h-12 bg-transparent border-none outline-none text-foreground placeholder:text-foreground-faint font-sans"
          />
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
          <Command.Empty className="py-6 text-center text-sm text-foreground-faint">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-mono text-accent uppercase tracking-widest">
            <Command.Item
              onSelect={() => runCommand(() => router.push("/#about"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <User className="w-4 h-4" />
              About
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/#skills"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Code className="w-4 h-4" />
              Skills
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/#experience"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              Experience
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/#projects"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Projects
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Case Studies" className="px-2 py-1.5 text-xs font-mono text-accent uppercase tracking-widest mt-2">
            <Command.Item
              onSelect={() => runCommand(() => router.push("/projects/log-analyser"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Log Analyser Case Study
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/projects/case-study-two"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Project Omega (Coming Soon)
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-mono text-accent uppercase tracking-widest mt-2">
            <Command.Item
              onSelect={() => runCommand(() => {
                track("resume_download_clicked");
                window.open("/resume.pdf", "_blank");
              })}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Resume
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(copyEmail)}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy Email Address
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(toggleTheme)}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Toggle Theme
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Social" className="px-2 py-1.5 text-xs font-mono text-accent uppercase tracking-widest mt-2">
            <Command.Item
              onSelect={() => runCommand(() => window.open(siteConfig.links.linkedin, "_blank"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              LinkedIn
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => window.open(siteConfig.links.github, "_blank"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              GitHub
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="px-4 py-2 border-t border-border bg-surface-raised flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded border border-border-strong bg-surface text-[10px] font-mono text-foreground-faint shadow-sm">
                ↑↓
              </kbd>
              <span className="text-[10px] text-foreground-faint uppercase tracking-wider">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded border border-border-strong bg-surface text-[10px] font-mono text-foreground-faint shadow-sm">
                Enter
              </kbd>
              <span className="text-[10px] text-foreground-faint uppercase tracking-wider">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-border-strong bg-surface text-[10px] font-mono text-foreground-faint shadow-sm">
              Esc
            </kbd>
            <span className="text-[10px] text-foreground-faint uppercase tracking-wider">Close</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
};
