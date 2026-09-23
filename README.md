# Portfolio

Personal portfolio website for a systems-minded software engineer — built with Next.js, featuring a full blog system (static MDX + moderated community posts), a live GitHub activity dashboard, and an interactive DSA (Data Structures & Algorithms) walkthrough synced from a companion repository.

**For AI agents / contributors:** read [`AGENTS.md`](./AGENTS.md) first, then [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`CONVENTIONS.md`](./CONVENTIONS.md). Current status is in [`TASKS.md`](./TASKS.md).

## Stack
Next.js 16.2.10 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 + PostgreSQL (Neon) · NextAuth (GitHub OAuth) · GSAP · Framer Motion · MDX (`next-mdx-remote`) · Playwright

## Repository structure
Follows Feature-Sliced Design (FSD):

| Path | Purpose |
|---|---|
| `app/` | Route composition, pages, API routes (App Router) |
| `widgets/` | Complex, composed UI sections (Header, Hero, GitHub dashboard, DSA visualizers, command palette, terminal) |
| `features/` | User interactions (contact form, theme toggle) |
| `entities/` | Small domain-specific UI/data (project cards, skill badges) |
| `shared/` | Config, cross-cutting libs, base UI (`shared/ui`), Prisma client, auth |
| `content/blog/` | First-party MDX blog posts |
| `prisma/` | Schema + migrations (Postgres) |
| `dsa-solutions/` | A committed snapshot supporting one DSA page — the live data source is the separate `SHIV1804/dsa-solutions` GitHub repo, fetched at request time |
| `tests/` | Playwright E2E specs |
| `docs/` | Content-integrity rules and historical session logs |

Full breakdown: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Local setup
```bash
npm ci
cp .env.example .env   # then fill in real values — see BUILD.md for the full variable list
npx prisma generate    # requires network access to binaries.prisma.sh
npx prisma migrate dev # first run only, against a real Postgres DATABASE_URL
npm run dev
```
Open http://localhost:3000.

## Common commands
```bash
npm run dev        # start dev server
npm run build       # production build
npm run lint         # ESLint
npm run test:e2e   # Playwright E2E suite (starts its own dev server)
```
Full details, including environment variables and a known sandbox limitation with `prisma generate`, are in [`BUILD.md`](./BUILD.md).

## Status
Actively developed on the `dev` branch (ahead of `main`). See [`TASKS.md`](./TASKS.md) for what's in progress, known placeholder content, and open issues; [`DECISIONS.md`](./DECISIONS.md) for why things are built the way they are.
