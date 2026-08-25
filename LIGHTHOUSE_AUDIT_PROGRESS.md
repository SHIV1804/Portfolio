# LIGHTHOUSE_AUDIT_PROGRESS.md

Goal: replace the self-estimated Lighthouse scores referenced in
PROJECT_CONTEXT.md with real, measured numbers from a production build.

---

## Session 1 — 2026-08-25

### What was done
1. Cloned `SHIV1804/Portfolio`, checked out `dev` (HEAD `b0b9a05`).
2. Audited the repo for existing Lighthouse claims before touching anything:
   `grep -rniE "lighthouse"` across `.md`, `.tsx`, `.ts`, `.mdx`, plus a
   manual check of `content/` and `app/`. Result: **no page, README, or
   case-study currently states a numeric Lighthouse score.** The only
   existing mentions are process notes (`PROJECT_CONTEXT.md` line 35,
   `AI_HANDOFF.md`) saying a real audit is still needed. So there was
   nothing fabricated in user-facing content to fix — the work here is to
   actually produce the real numbers those notes are waiting on.
3. Found a pre-existing `lighthouse-reports/` directory already committed
   in the repo (`case-study-two.report.json/html`, `home.report.json/html`,
   `log-analyser.report.json/html`, plus some undated `-final`/`-v2`
   files). Inspected `home.report.json`: `fetchTime: 2026-07-08T18:56:33Z`,
   audited against `http://localhost:3000/` (i.e. a local production
   server from a prior session), `lighthouseVersion: 12.8.2`. Scores in
   that file: Performance 0.86, Accessibility 0.96, Best Practices 0.96,
   SEO 1.00. **I have not verified how that server was started or whether
   it reflects current `dev` HEAD** — it's 7 weeks old and the branch has
   moved since (blog system, GitHub dashboard, terminal easter egg, XSS
   fix, etc. per `PROJECT_CONTEXT.md`'s "Recent Changes"). I'm treating it
   as historical only, not as this session's measurement, and not
   reporting it as current. Flagging its existence for the user in case it
   matters to them.
4. Attempted a fresh, real audit per the task instructions. Blocked — see
   Findings.

### Findings — audit could not be completed this session
Two independent, confirmed blockers in this sandbox:

**A. No usable Chrome/Chromium for Lighthouse.**
- `chromium`, `chromium-browser`, `google-chrome` — not installed, not on
  PATH.
- `apt-get install chromium` — the Ubuntu package is a snap-transition
  stub (`2:1snap1-0ubuntu2`) and doesn't provide a real binary in this
  container; several unrelated apt dependencies also 404'd.
- One real browser binary exists on disk:
  `~/.cache/puppeteer/chrome-headless-shell/linux-131.0.6778.204/...`
  (`chrome-headless-shell --version` → `Google Chrome for Testing
  131.0.6778.204`, confirmed working). This is a minimal shell built for
  driving via CDP, not full Chrome — untested whether Lighthouse's full
  audit (esp. some Best Practices/PWA checks) behaves identically on it.
  Moot given blocker B below.

**B. Production build does not complete — network-sandboxed dependency.**
- `npm install` → `postinstall` (`prisma generate`) fails:
  `Failed to fetch sha256 checksum at
  https://binaries.prisma.sh/.../libquery_engine.so.node.gz.sha256 - 403`.
- Confirmed this is a sandbox network-policy block, not a transient
  error: `curl -sD- https://binaries.prisma.sh/...` → `HTTP/2 403`,
  header `x-deny-reason: host_not_allowed`. `binaries.prisma.sh` is not in
  this environment's allowed-domains list.
- Tried `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` — still 403s trying to
  fetch the engine file itself.
- Tried `prisma generate --no-engine` (types-only, no query engine) — the
  Prisma CLI itself needs to fetch a `schema-engine` binary from the same
  blocked host just to run `generate` at all. No workaround available
  without network access to that host.
- Searched the filesystem for any pre-cached engine binary
  (`libquery_engine*`, `~/.cache/prisma/`) — none present.
- Because the client never generates, `@prisma/client` resolves to its
  placeholder stub (`PrismaClient: any`, no schema-derived types/enums).
  `npm run build` fails TypeScript checking on
  `app/admin/posts/page.tsx:8` — `Module '"@prisma/client"' has no
  exported member 'PostStatus'`. `PostStatus` is used as a **runtime**
  enum value (not just a type) in `app/admin/posts/page.tsx`,
  `app/api/admin/posts/**`, `app/api/posts/route.ts`, and
  `shared/lib/blog-db.ts`.
- As a diagnostic-only, **local, uncommitted** experiment, I set
  `typescript: { ignoreBuildErrors: true }` in `next.config.ts` to see if
  routes that don't touch Prisma (home, `/dsa`, case studies) could still
  build. Result: no — `next build` collects page data for *all* routes
  including API routes during the build step, and
  `/api/admin/posts/[id]` throws at module evaluation (`@prisma/client
  did not initialize yet`), which fails the whole build. Reverted this
  change immediately (`git checkout -- next.config.ts`); repo is back to
  a clean `git status` with nothing committed or left modified.
- Also relevant: `/blog` specifically needs a real reachable
  `DATABASE_URL` at request time (`shared/lib/blog-db.ts`), not just a
  generated client — a second, independent reason that route can't be
  audited from this sandbox even if the Prisma generation issue were
  fixed.

### Files touched
- None, permanently. `next.config.ts` was temporarily edited and reverted
  (`git status` clean, verified). `.env.local` created locally
  (gitignored, placeholder values) to test the build — not committed, not
  a deliverable.

### Verification
- `git status` on `dev` → clean, no diff from `origin/dev`.
- No scores were written anywhere in the repo this session. No numbers in
  this log are claimed as measured — everything under "Findings" is a
  build/tooling error message, quoted directly.

### Next step
This sandbox can't reach `binaries.prisma.sh` (network allowlist) and has
no full Chrome build, so I can't produce a real Lighthouse number this
session without one of:
1. You provide a **live, reachable URL** for the deployed site (e.g. the
   Vercel URL in `.env.example`) — if this sandbox's network allowlist
   ever includes it, I can run `npx lighthouse <url>` directly with no
   local build needed. As of this session, `vercel.app` is not on the
   allowed-domains list either, so this would need the allowlist updated
   on your end.
2. You (or a session with open network access) run
   `npm run build && npm run start` plus
   `npx lighthouse http://localhost:3000 --output=json,html
   --output-path=./lighthouse-reports/home` yourself / in an environment
   with access to `binaries.prisma.sh`, and I take it from there —
   parsing results and updating docs is something I can still do.
3. You ask me to strip/mock the Prisma-dependent admin & blog-DB routes
   temporarily so the rest of the app builds — I didn't do this
   unprompted since it changes app code and would only audit a modified
   version of the site, not the real one.

I have **not** updated `PROJECT_CONTEXT.md`'s Lighthouse line with any
score, because I don't have one. I'll update it once a real number
exists.

---

## Session 2 — 2026-08-25 (reported by user)

**Attribution note:** everything below was run and reported by the repo
owner on their own machine (network access this sandbox doesn't have),
not measured directly by me in this session. I was not given the raw
`.json`/`.html` Lighthouse output files to inspect (fetchTime,
`lighthouseVersion`, environment fields, etc. — the way I verified the
pre-existing `lighthouse-reports/` files in Session 1), so I can't
independently corroborate these numbers the way I would data I generated
myself. Recording them as reported, clearly labeled as such. If the raw
report files get added to `lighthouse-reports/`, this note should be
updated to reflect that they were verified.

### What was done
- `npm run build && npm run start` (Next.js production mode, Windows
  machine, real network access to `binaries.prisma.sh`).
- `npx lighthouse` (headless Chrome) against 4 pages.

### Environment caveats (as reported)
- `DATABASE_URL` unset for this run — `/blog`'s community-post section
  rendered in its empty/fallback state, not with live DB data. Scores
  reflect the MDX/static content paths, not a populated blog.
- Local production build, not the live Vercel edge deployment — CDN
  caching and edge latency aren't reflected.

### Results (as reported — Performance / Accessibility / Best Practices / SEO)
| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` (homepage) | 69 | 96 | 96 | 100 |
| `/blog` | 80 | 93 | 96 | 100 |
| `/dsa` | 76 | 88 | 96 | 91 |
| `/projects/log-analyser` | 72 | 94 | 96 | 100 |

### Known issues flagged (as reported)
- Homepage Performance (69) is the weakest of the four — GSAP animations,
  GitHub dashboard, and terminal easter egg are candidates, not yet
  root-caused. Worth a follow-up pass at per-audit detail (LCP breakdown,
  render-blocking resources, unused JS) if performance work becomes a
  priority.
- `/dsa` SEO (91) is the only non-100 SEO score across the four pages —
  worth checking that page for a missing meta description, canonical tag,
  or similar.
- The Session-1-referenced `lighthouse-reports/` audit from 2026-07-08
  (86/96/96/100, homepage only) is now superseded and should not be cited
  as current — it predates the blog system, GitHub dashboard, terminal
  easter egg, and XSS fix.

### Files
- No raw report files were added to `lighthouse-reports/` this session
  (none were shared with me). `PROJECT_CONTEXT.md` updated with the
  table above in place of the "blocked" note from Session 1.

### Next step
- If the raw `.json`/`.html` Lighthouse output exists, commit it into
  `lighthouse-reports/` (e.g. `home-2026-08-25.report.json`, etc.) so a
  future session can verify fetchTime/version/environment the same way
  Session 1 did for the pre-existing files, rather than relying on a
  reported table.
- Optional: re-audit against the live Vercel deployment once
  `DATABASE_URL` and other prod env vars are confirmed set, to capture
  real-world/CDN conditions and a populated `/blog`.
