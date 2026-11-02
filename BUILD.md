# BUILD.md

Real, verified commands and environment requirements for this repository.

## Prerequisites
- Node.js (repo uses `@types/node@^20`; the sandbox this doc was verified in ran Node 22 without issue)
- npm (lockfile is `package-lock.json`; a `pnpm-lock.yaml` and `pnpm-workspace.yaml` also exist in the repo — see `TASKS.md`, dual-lockfile is an open item, not a documented convention)
- A PostgreSQL database (the project targets Neon) for any work touching auth or the community blog
- Network access to `binaries.prisma.sh` for `prisma generate` to succeed (see "Known sandbox limitation" below)

## Install
```bash
npm ci
```

## Generate the Prisma client
```bash
npx prisma generate
```
Required before `next build`/`next dev` will type-check code that imports from `@prisma/client` (`shared/lib/prisma.ts`, `shared/lib/blog-db.ts`, the blog/admin API routes, `app/admin/posts/page.tsx`).

### Known sandbox limitation (verified)
In network-restricted environments, `prisma generate` fails:
```
Error: Failed to fetch sha256 checksum at
https://binaries.prisma.sh/.../libquery_engine.so.node.gz.sha256 - 403 Forbidden
```
`prisma generate --no-engine` fails the same way (it still needs the checksum). This is an environment/network problem, not a code bug — this project's own history logs (`docs/history/CONTENT_VERIFICATION_PROGRESS.md`, `docs/history/DSA_FLAGSHIP_PROGRESS.md`) record hitting the identical error repeatedly across sessions. Without a generated client, both `npx tsc --noEmit` and `next build` fail with:
```
error TS2305: Module '"@prisma/client"' has no exported member 'PostStatus'.
error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'.
```
in `shared/lib/prisma.ts`, `shared/lib/blog-db.ts`, `app/api/posts/route.ts`, `app/api/admin/posts/route.ts`, `app/api/admin/posts/[id]/route.ts`, `app/admin/posts/page.tsx`. **Do not attempt to "fix" this by editing those files** — get real network access to `binaries.prisma.sh` (or a pre-generated client) instead. `npm run lint` (ESLint) does **not** depend on the generated client and runs cleanly regardless (verified: 0 errors, 14 pre-existing warnings, all in test files plus one `react-hooks/exhaustive-deps` warning in `BinarySearchVisualizer.tsx`).

## Database
```bash
npx prisma migrate dev   # applies prisma/migrations/*, requires a real DATABASE_URL
```
If `DATABASE_URL` is unset or unreachable, the app does **not** crash — `shared/lib/blog-db.ts`'s helpers catch the error and return `[]`/`null`, so `/blog` renders with only MDX posts and the admin/write flows simply won't have data. This is a deliberate fallback (see `DECISIONS.md`), not a bug to route around.

## Development
```bash
npm run dev      # next dev, http://localhost:3000
```

## Production build
```bash
npm run build    # next build — requires a generated Prisma client, see above
npm run start    # next start, after a build
```

## Lint
```bash
npm run lint     # eslint (flat config: eslint-config-next core-web-vitals + typescript)
```

## Tests (Playwright E2E)
```bash
npm run test:e2e   # playwright test — starts its own `npm run dev` server (playwright.config.ts webServer block) unless CI=true
```
Requires Playwright browser binaries to be installed (`npx playwright install`) — not verified installable in the network-restricted sandbox this doc was written in.

## Environment variables
`.env.example` currently documents: `RESEND_API_KEY`, `CONTACT_EMAIL`, `GITHUB_TOKEN`, `DATABASE_URL`, `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`.

**Verified against actual `process.env.*` usage in the codebase — three variables are used in code but missing from `.env.example`:**

| Variable | Used in | Purpose |
|---|---|---|
| `DSA_GITHUB_REPO` | `shared/lib/dsa-sync.ts` | `owner/repo` string for the companion DSA repo (e.g. `SHIV1804/dsa-solutions`); without it, `fetchDSAProblems()`/`fetchDSATrace()` log an error and return `[]`/`null` |
| `DSA_WEBHOOK_SECRET` | `app/api/dsa-webhook/route.ts` | HMAC secret for verifying the inbound GitHub webhook signature; without it, the route returns HTTP 500 |
| `NEXT_PUBLIC_SITE_URL` | `app/rss.xml/route.ts` | Base URL for RSS feed links; falls back to a hardcoded `https://shivam.dev` placeholder if unset |

`GITHUB_TOKEN` is used for two distinct purposes — a GitHub PAT for the DSA-repo REST calls, and (same variable) the GraphQL query in `widgets/github-stats/lib/github.ts` for the live activity dashboard. `GITHUB_ID`/`GITHUB_SECRET` are the separate OAuth app credentials for sign-in, not the same as `GITHUB_TOKEN`.

## Deployment
Configured for Vercel (`@vercel/analytics` is wired into `app/layout.tsx`; `siteConfig.url` in `shared/config/site.ts` points at a `*.vercel.app` domain). No `vercel.json` is present — deployment relies on Vercel's Next.js defaults. `postinstall` runs `prisma generate` automatically (`package.json`), so Vercel's build environment (which has real network access) generates the client without the sandbox issue above.
