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
3. **Lighthouse**: Scores were previously self-estimated; real measurement needed.
4. **Resend**: API keys not yet configured.

## Recent Changes
- **Blog System**: Implemented a full production-grade blog with MDX, search, tags, RSS, and dynamic OG images.
- **GitHub Dashboard**: Built a live activity dashboard using the GitHub GraphQL API, featuring a contribution heatmap, language breakdown, and pinned repositories.
- **Terminal Easter Egg**: Implemented a genuinely interactive terminal shell with command history, tab completion, and real data integration (whoami, skills, projects, theme).
- **Navigation**: Added "Blog" and "GitHub" to the site header.
- **Sitemap**: Updated to include blog posts.
- **Testing**: Integrated Playwright for E2E testing, covering core site features and the new terminal easter egg.
