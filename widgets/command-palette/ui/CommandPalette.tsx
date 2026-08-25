"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter, usePathname } from "next/navigation";
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
  // G2 root cause (real network trace, not the "onSelect wiring" theory this
  // fix was originally briefed against): Command.Item's onSelect fires
  // identically for click and keyboard (Enter) — cmdk doesn't distinguish
  // them, so there was never a keyboard-specific bug. Two distinct real
  // defects found instead:
  //
  // 1. router.push("/#about") etc. triggers a real Next.js App Router RSC
  //    round-trip (confirmed: a GET /?_rsc=... request) even when the
  //    destination is just an anchor on the current page — ~170-260ms when
  //    already on "/". Fixed in navigateToSection() below by bypassing the
  //    router entirely for same-page anchors (History API + scrollIntoView,
  //    synchronous, no round-trip). This is what the "Enter selects a
  //    highlighted command" / "navigation command navigates correctly"
  //    tests exercise, and what this session was actually briefed against.
  //
  // 2. Separately (the architecture-diagram regression): selecting "About"
  //    from a different route (e.g. a case-study page) cold-fetches the
  //    entire home route's RSC payload — measured ~800ms in this dev
  //    environment (Turbopack, unminified; router.prefetch() ahead of time
  //    did not reduce this in dev — tried and reverted). router.push()
  //    returns void with no completion signal, so if a second
  //    navigation-triggering command fires before that ~800ms lands, Next's
  //    client router drops BOTH navigations silently (confirmed: final
  //    state stays on the original page indefinitely, not just delayed).
  //    Blocking the Ctrl+K shortcut while a nav is pending was tried first
  //    and made this worse — architecture-diagram's regression test sends a
  //    single, non-retried Control+k keypress with no wait, so an ignored
  //    keypress just hangs the test forever rather than fixing anything.
  //    The actual fix (below, navQueueRef) instead lets the palette open
  //    and close freely, but serializes the underlying router.push calls:
  //    a second navigation command waits for the previous one's pathname to
  //    actually land (polled via usePathname(), 3s safety-net timeout)
  //    before firing, so two rapid commands settle in order instead of
  //    colliding.
  const pathname = usePathname();
  const pathnameRef = React.useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  const navQueueRef = React.useRef<Promise<void>>(Promise.resolve());

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

  // Serializes real route changes: waits for any previously-queued
  // navigation's target pathname to actually land before firing the next
  // router.push. Never blocks the palette UI itself — only the underlying
  // navigation side effect — so Ctrl+K / reopening always works instantly.
  const navigateToRoute = (path: string) => {
    const targetPathname = path.split("#")[0] || "/";
    navQueueRef.current = navQueueRef.current.then(
      () =>
        new Promise<void>((resolve) => {
          router.push(path);
          const deadline = Date.now() + 3000;
          const poll = () => {
            if (pathnameRef.current === targetPathname || Date.now() > deadline) {
              resolve();
            } else {
              setTimeout(poll, 20);
            }
          };
          poll();
        }),
    );
  };

  // In-page section anchors (About/Skills/Experience/Projects) bypass the
  // router entirely when already on "/" — there's no server data to refetch
  // for a same-page scroll, so this is synchronous with no round-trip. A
  // cross-page target (case studies, or landing on "/" from elsewhere)
  // still needs a real route change, queued via navigateToRoute above.
  const navigateToSection = (hash: string) => {
    if (window.location.pathname === "/") {
      window.history.pushState(null, "", `/${hash}`);
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigateToRoute(`/${hash}`);
    }
  };

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
      contentClassName="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-background/40 backdrop-blur-sm"
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
              onSelect={() => runCommand(() => navigateToSection("#about"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <User className="w-4 h-4" />
              About
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigateToSection("#skills"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Code className="w-4 h-4" />
              Skills
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigateToSection("#experience"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              Experience
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigateToSection("#projects"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Projects
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Case Studies" className="px-2 py-1.5 text-xs font-mono text-accent uppercase tracking-widest mt-2">
            <Command.Item
              onSelect={() => runCommand(() => navigateToRoute("/projects/log-analyser"))}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground-muted aria-selected:bg-surface-raised aria-selected:text-foreground cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Log Analyser Case Study
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigateToRoute("/projects/case-study-two"))}
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
