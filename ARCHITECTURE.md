# ARCHITECTURE.md

Real architecture, discovered from the code (`dev` branch, commit `b9b057a`). Only documents what exists.

## High-level flow
```
Visitor
 ↓
Next.js App Router (app/)
 ↓
widgets/ (page sections)  ──uses──▶  features/, entities/, shared/
 ↓
app/api/** route handlers  ──▶  Prisma (Postgres/Neon)  |  Resend  |  GitHub REST/GraphQL API
```

## Route map (`app/`)
| Route | Renders | Data source |
|---|---|---|
| `/` | `app/page.tsx` | Composes `HeroSection`, `AboutSection`, `SkillsGrid`, `ExperienceTimeline`, `ProjectsPreview`, `GitHubStats`, `ContactForm` |
| `/blog` | `app/blog/page.tsx` | `shared/lib/blog.ts` (MDX files in `content/blog/`) + `shared/lib/blog-db.ts` (approved DB posts), merged and sorted client-side via `BlogSearch` |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Same two sources; DB posts render through `renderSafeMarkdown`, MDX posts through `MDXRemote` |
| `/blog/write` | `app/blog/write/page.tsx` | Client component; requires an authenticated session; posts to `POST /api/posts` |
| `/blog/tags/[tag]` | `app/blog/tags/[tag]/page.tsx` | Filters `getAllPosts()` by tag |
| `/admin/posts` | `app/admin/posts/page.tsx` | Client component; requires `session.user.isAdmin`; calls `GET /api/admin/posts` and `PATCH /api/admin/posts/[id]` |
| `/dsa` | `app/dsa/page.tsx` | `fetchDSAProblems()` — GitHub REST call to `SHIV1804/dsa-solutions` at request time |
| `/dsa/[pattern]/[slug]` | `app/dsa/[pattern]/[slug]/page.tsx` | `getDSAProblemBySlug()`; renders `PatternVisualizer` + MDX write-up + solution code (Shiki via `rehype-pretty-code`) |
| `/dsa/flagship/two-sum` | `app/dsa/flagship/two-sum/page.tsx` | `getDSAProblemBySlug('hash-map','two-sum')` + `fetchDSATrace()`; custom interactive walkthrough (`ArrayBox`, `ExecutionPanel`, `DiscoveryTransition`) |
| `/dsa/flagship/max-sum-subarray` | `app/dsa/flagship/max-sum-subarray/page.tsx` | Same pattern for the sliding-window problem; uses `SlidingWindowVisualizer` |
| `/projects/log-analyser` | `app/projects/log-analyser/page.tsx` | Static content via `CaseStudyLayout` + `ArchitectureDiagram`; marked `Concept` — no implementation exists (see `docs/CONTENT.md`) |
| `/projects/case-study-two` | `app/projects/case-study-two/page.tsx` | `CaseStudyLayout`; content is an explicit `[PLACEHOLDER]` — project not yet selected |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | `app/rss.xml/route.ts`, `app/sitemap.ts`, `app/robots.ts` | Derived from `getAllPosts()` + `siteConfig` |

API routes: `app/api/contact` (Resend email, in-memory rate limit, honeypot field), `app/api/posts` (create a pending community post, auth-gated), `app/api/admin/posts` + `app/api/admin/posts/[id]` (moderation, admin-gated), `app/api/auth/[...nextauth]` (NextAuth handler), `app/api/dsa-webhook` (HMAC-verified GitHub webhook that revalidates `/dsa` on push to the DSA repo's main branch).

There are no `loading.tsx` / `error.tsx` / `not-found.tsx` boundaries anywhere in `app/`, and no `middleware.ts`.

## Data layer
- **Postgres (Neon) via Prisma** (`prisma/schema.prisma`): `User`, `Account`, `Session`, `VerificationToken` (NextAuth adapter tables) + `Post` (community blog submissions, `PENDING`/`APPROVED`/`REJECTED`).
- **`shared/lib/prisma.ts`**: singleton `PrismaClient`, cached on `globalThis` in non-production to survive HMR.
- **`shared/lib/blog-db.ts`**: `getApprovedCommunityPosts()` / `getApprovedCommunityPostBySlug()` — both wrap their Prisma calls in try/catch and return `[]`/`null` on any failure (including a missing/misconfigured `DATABASE_URL`), so the rest of the site (MDX content, DSA pages, static routes) keeps working even with no database configured. This fallback is intentional — see `DECISIONS.md`.
- **MDX content**: `shared/lib/blog.ts` reads `content/blog/*.mdx` directly off disk with `fs`/`gray-matter` at request/build time — no CMS.

## External integrations
| Integration | Used by | Notes |
|---|---|---|
| GitHub REST API | `shared/lib/dsa-sync.ts` | Fetches problem files from `SHIV1804/dsa-solutions` via `DSA_GITHUB_REPO` + `GITHUB_TOKEN`, `revalidate: 3600` |
| GitHub GraphQL API | `widgets/github-stats/lib/github.ts` | Live contribution calendar, language breakdown, pinned repos for `siteConfig.links.github`'s user, `revalidate: 3600` |
| GitHub OAuth | `shared/lib/auth.ts` (NextAuth) | Sign-in for blog authorship + admin moderation; falls back to `GET /user/emails` when GitHub doesn't return a public email |
| GitHub webhook | `app/api/dsa-webhook/route.ts` | Inbound: verifies `X-Hub-Signature-256` (HMAC-SHA256, `crypto.timingSafeEqual`) against `DSA_WEBHOOK_SECRET`, then `revalidatePath('/dsa')` on a push to the DSA repo's default branch |
| Resend | `app/api/contact/route.ts` | Transactional email for the contact form; lazily instantiated so a missing `RESEND_API_KEY` doesn't break the build |
| Vercel Analytics | `app/layout.tsx`, `CommandPalette.tsx` (`resume_download_clicked`), `CaseStudyLayout.tsx` (`case_study_viewed`) | Page views + two custom events |

## Companion repository: `SHIV1804/dsa-solutions`
Not a dependency in `package.json` — a separate GitHub repo that this app polls at request time via the REST API (see table above). Its contract (enforced by convention, not code on this side):
```
problems/<pattern-slug>/<problem-slug>/
  meta.md        — YAML frontmatter: title, leetcodeNumber, leetcodeUrl, difficulty, pattern, tags, dateSolved, exampleInput
  solution.cpp    — the solution (C++ by default; other extensions supported, mapped to a Shiki language in app/dsa/[pattern]/[slug]/page.tsx)
  writeup.md      — approach / why-this-pattern / complexity
  trace.json      — optional; only for problems with a flagship interactive walkthrough (two-sum, max-sum-subarray today). Schema = the DSATrace/DSATracePhase/DSATraceStep interfaces in shared/lib/dsa-sync.ts
```
`dsa-solutions/problems/sliding-window/max-sum-subarray/trace.json` is a **committed snapshot** in this repo (used by `generate_sliding_window_trace.py`'s output), separate from the live copy served by the actual `dsa-solutions` GitHub repo at request time — the two are not automatically kept in sync by any code here.

## Security-relevant boundaries
- **`shared/lib/safe-markdown.ts`**: the only path allowed to render visitor-submitted (DB-backed) post content. Pipeline: `remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-sanitize` (strict default schema — strips raw HTML, event handlers, `script`/`style`, `javascript:` URLs) → `rehype-stringify`. First-party `content/blog/*.mdx` is trusted and uses `MDXRemote` instead. See rule 2 in `AGENTS.md` and the in-code comment for the full rationale.
- **`app/api/dsa-webhook/route.ts`**: HMAC-SHA256 signature verification with constant-time comparison before processing any webhook payload.
- **Admin gating**: `session.user.isAdmin` is computed server-side in the NextAuth `session` callback (`shared/lib/auth.ts`) by comparing the signed-in email to `ADMIN_EMAIL` — never trusted from the client.

## Design system
Dark-mode-first; light mode is a genuine second mode (warm paper `#F3F1EC`, not stark white). Signature accent is an amber-phosphor terminal color. All colors are CSS custom properties in `app/globals.css` (`:root` = light, `.dark` = dark), re-exposed as Tailwind tokens via `@theme inline`. Fonts: Geist Sans / Geist Mono (`geist` package). Theme persists to `localStorage` under `portfolio-theme`, applied pre-hydration via an inline script (`themeInitScript` in `features/theme-toggle/model/theme-provider.tsx`) to avoid a flash of the wrong theme.

## Notable interactive widgets
- **Command palette** (`widgets/command-palette`, `cmdk`): `Cmd/Ctrl+K`. Navigation, case studies, resume download (`/resume.pdf` — not currently present in `public/`, see `TASKS.md`).
- **Terminal easter egg** (`widgets/terminal-easter-egg`): opened via `/` keypress (from `Footer.tsx`) or the footer's terminal icon; commands defined in `lib/commands.ts` (`whoami`, `help`, `contact`, `skills`, `projects`, `open [slug|resume]`, `theme [light|dark]`, `clear`, `exit`).
- **DSA pattern visualizers** (`widgets/dsa/ui/visualizers/`): `TwoPointersVisualizer`, `SlidingWindowVisualizer`, `BinarySearchVisualizer`, dispatched by `PatternVisualizer.tsx` based on `problem.pattern`.
