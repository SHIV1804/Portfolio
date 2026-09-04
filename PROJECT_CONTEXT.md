# PROJECT_CONTEXT.md

## Project Purpose
A professional portfolio website for a systems-minded software engineer.

## Tech Stack
- **Framework**: Next.js 16.2.10 (App Router)
- **Styling**: Tailwind CSS 4.0
- **Animations**: GSAP
- **Blog**: MDX (next-mdx-remote), gray-matter, rehype-pretty-code
- **Icons**: Lucide React
- **Types**: TypeScript

## Architecture
Follows **Feature-Sliced Design (FSD)**:
- `app/`: Route composition
- `widgets/`: Complex UI components (Header, Hero, Blog widgets)
- `features/`: User interactions (Contact Form, Theme Toggle)
- `entities/`: Domain-specific UI (ProjectCard, SkillBadge)
- `shared/`: Utilities, config, and global styles

## Design System
- **Theme**: Dark-mode-first. Light mode is warm paper (`#F3F1EC`).
- **Accent**: Amber phosphor (`var(--accent)`).
- **Fonts**: Geist Sans & Geist Mono.

## Content Rules
- **No Fabrication**: Do not invent personal facts or technical claims.
- **Verification**: Use `VERIFIED:` markers in code for confirmed claims.
- **Audience**: Recruiters (primary), Technical Interviewers, Professional Network.

## Known Issues Log
1. **Unverified Claims**: `app/projects/log-analyser/page.tsx` contains unverified technical claims.
2. **Placeholder Content**: "About" section and "Project Omega" are placeholders.
3. **Lighthouse**: Real audit completed 2026-08-25 (local production build; reported by repo owner, not independently verified from raw report files — see `LIGHTHOUSE_AUDIT_PROGRESS.md`). Homepage 69/96/96/100, Blog 80/93/96/100 (DB unset, fallback content), DSA 76/88/96/91, Log Analyser 72/94/96/100 (Performance/Accessibility/Best Practices/SEO). Homepage performance and DSA SEO flagged for follow-up. This local-build run does not reflect the live Vercel edge deployment.
4. **Resend**: API keys not yet configured.

## Recent Changes
- **Blog System**: Implemented a full production-grade blog with MDX, search, tags, RSS, and dynamic OG images.
- **GitHub Dashboard**: Built a live activity dashboard using the GitHub GraphQL API, featuring a contribution heatmap, language breakdown, and pinned repositories.
- **Terminal Easter Egg**: Implemented a genuinely interactive terminal shell with command history, tab completion, and real data integration (whoami, skills, projects, theme).
- **Navigation**: Added "Blog" and "GitHub" to the site header.
- **Sitemap**: Updated to include blog posts.
- **Testing**: Integrated Playwright for E2E testing, covering core site features and the new terminal easter egg.

46	- **Security Hardening**: Fixed a stored-XSS vulnerability in community blog posts by implementing a sanitized Markdown pipeline (`safe-markdown.ts`).
47	- **Content & Cleanup**: Removed public debug pages and draft internal-voice markers. Consolidated contact information into `siteConfig`.
48	- **Build Fix**: Resolved Turbopack build issues by adding `"use client"` to the `useReducedMotion` hook.
49	- **Repository Re-sync**: Re-established GitHub as the authoritative source of truth, reconciling drift across multiple agent sessions.
50	
