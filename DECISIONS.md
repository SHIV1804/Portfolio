# DECISIONS.md

Technical decisions with evidence in code, config, or this project's own history logs (`docs/history/`). Where the original reasoning wasn't recorded, that's stated explicitly rather than invented.

---
**Decision:** Fail-soft database access — every Prisma call in `shared/lib/blog-db.ts` is wrapped in try/catch and returns `[]`/`null` on failure, instead of throwing.
**Context:** Community blog posts depend on a live Postgres connection; the rest of the site (MDX content, DSA pages, static routes) does not.
**Reason:** Decouples the database from the build/render path — a missing or unreachable `DATABASE_URL` degrades the blog to MDX-only instead of crashing the whole site. (`docs/history/DSA_FLAGSHIP_PROGRESS.md`, "Blog System Resilience Fix" / "Blog Resilience Final Verification".)
**Impact:** Any new DB-backed feature should follow the same pattern — catch and degrade, don't let a DB outage take down unrelated pages.

---
**Decision:** Visitor-submitted (DB-backed) blog posts are rendered through a dedicated sanitized Markdown pipeline (`shared/lib/safe-markdown.ts`: `remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-sanitize` → `rehype-stringify`), never through `MDXRemote`.
**Context:** `content/blog/*.mdx` (first-party, trusted) already used `MDXRemote`; adding user-submitted DB posts introduced untrusted input into the render path.
**Reason:** MDX compiles to executable JSX/JS. Passing untrusted visitor input into an MDX compiler is a documented risk (flagged in `next-mdx-remote`'s own docs) — a malicious post could embed a JSX expression that executes in every visitor's browser once approved, and a human moderator might not catch it. `rehype-sanitize`'s default strict schema strips raw HTML, event handlers, `script`/`style` tags, and dangerous URL schemes, leaving formatting-only output.
**Impact:** This boundary must never be blurred (see `AGENTS.md` rule 2) — any change that renders DB-sourced content must go through `renderSafeMarkdown`.

---
**Decision:** Auth provider is GitHub OAuth only; admin identity is a single `ADMIN_EMAIL` env-var comparison (`session.user.isAdmin`) rather than a role table/RBAC UI.
**Reason:** "Using ADMIN_EMAIL env var for runtime admin checks to avoid complex RBAC UI in this initial phase." (`docs/history/BLOG_AUTH_PROGRESS.md`, Chunk 0.)
**Impact:** Adding a second admin, or moving beyond a single owner, requires revisiting this — it does not scale past one admin without a schema/auth change.

---
**Decision:** Prisma pinned at `6.2.1` (not the current major at time of writing).
**Reason:** Prisma 7.x changed how `datasource url` is configured (Accelerate/direct-adapter split), which would require reworking `prisma/schema.prisma` and `shared/lib/prisma.ts`. 6.2.1 keeps the existing single-`url` configuration working. (`docs/history/BLOG_AUTH_PROGRESS.md`.)
**Impact:** Don't bump the Prisma major version without also revisiting the datasource configuration.

---
**Decision:** DSA problem data is fetched from the separate `SHIV1804/dsa-solutions` GitHub repo via the REST API at request time (`revalidate: 3600`), rather than vendoring the problems into this repo or using a database.
**Reason:** Not explicitly documented in the logs, but the pattern is consistent with `revalidate: 3600` already used for the GitHub stats dashboard (`docs/history/DSA_FEATURE_PROGRESS.md`: "Set `revalidate: 3600` to match the existing GitHub stats pattern, ensuring fresh data without rebuilding the entire site"), and lets the DSA repo be updated independently of a portfolio redeploy. The GitHub REST API (not GraphQL) was chosen specifically because it's "more straightforward for directory tree traversal and raw file downloads (`download_url`)."
**Impact:** The two repos share an implicit schema contract (`meta.md` frontmatter shape, `trace.json` shape) that isn't enforced by shared code — see `AGENTS.md` rule 3.

---
**Decision:** The inbound DSA-repo webhook (`app/api/dsa-webhook/route.ts`) verifies `X-Hub-Signature-256` with `crypto.timingSafeEqual` and only triggers revalidation for pushes to the DSA repo's default branch.
**Reason:** Constant-time comparison is standard practice against timing attacks on HMAC verification; branch-scoping avoids unnecessary revalidation on feature-branch pushes. (`docs/history/DSA_FEATURE_PROGRESS.md`.)

---
**Decision:** Contact-form and community-post-submission rate limiting uses an in-memory `Map`, acknowledged as a soft mitigation.
**Reason:** "Vercel's serverless functions are stateless and memory is not shared or persisted between invocations" — the in-memory check is a fast first line of defense, backed by a real database-level check for pending-post count (`app/api/posts/route.ts`). (`docs/history/DSA_FEATURE_PROGRESS.md`, `docs/history/BLOG_AUTH_PROGRESS.md`.)
**Impact:** This is not real distributed rate limiting. If abuse becomes a problem, it needs a shared store (e.g. Redis/Upstash), not a bigger in-memory map.

---
**Decision:** "No fabrication" content policy — placeholder content is marked `[PLACEHOLDER: ...]` inline, and confirmed factual claims are marked with a `VERIFIED:` comment stating what was checked and how.
**Reason:** The site's primary audience is recruiters and technical interviewers; an unverifiable or invented claim undermines the portfolio's credibility more than an honest placeholder does. See `docs/CONTENT.md` for the current inventory of what's marked which way.
**Impact:** Any AI agent adding content to this site must follow the same marker convention — see `AGENTS.md` rule 1.

---
**Decision:** npm is the authoritative package manager for the dependency-upgrades branch and its follow-up stages.
**Reason:** `package-lock.json` is retained and the obsolete pnpm metadata was removed in `393f5f5`; CI installs with `npm ci`.
**Impact:** Do not reintroduce `pnpm-lock.yaml` or `pnpm-workspace.yaml` while executing the staged dependency work.

---
**Decision:** Stay on NextAuth v4 for the staged dependency work.
**Reason:** `next-auth` 4.24.15 is the latest stable v4 release verified for this branch; v5 remains beta and is a separate migration.
**Impact:** Do not upgrade to a v5 beta as part of the safe-range or major-version stages.

---
**Decision:** The session-observer tests share one console-noise ignore list.
**Reason:** The existing navigation and general console tests intentionally tolerate `ResizeObserver`, `Non-Error promise rejection`, and `Uncaught (in promise)` noise; keeping the list in the helper prevents the tests from silently diverging.
**Impact:** New console-error assertions should use `isIgnorableConsoleError()` rather than adding test-local exceptions.

---
**Decision:** Upgrade the Lighthouse devDependency to `13.6.0` as the first Stage 3 dependency change.
**Reason:** Lighthouse 13.6.0 removes the Lighthouse 12-era high-severity transitive findings and is compatible with the repository's CLI-only usage. Official release notes require Node `>=22.19`; CI requests Node 22, so CI's resolved Node 22 patch must satisfy that engine requirement. The sandbox's Node `22.13.0` reports `EBADENGINE`, although installation and the application build remain functional.
**Impact:** No application script or workflow invokes Lighthouse. Any future Lighthouse CLI use must run on Node `>=22.19`.

**Auth.js v5 follow-up:** Remove the `@auth/core` compatibility override when migrating from NextAuth v4 to Auth.js v5; it is a v4 compatibility measure and must not be carried into the v5 migration.
