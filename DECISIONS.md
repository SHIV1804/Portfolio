# DECISIONS.md

Technical decisions with evidence in code, config, or this project's own history logs (`docs/history/`). Where the original reasoning wasn't recorded, that's stated explicitly rather than invented.

---
**ADR: Online IDE execution backend (owner gate)**
**Status:** Proposed and documented for owner approval; T2-T12 may proceed with a mock provider only.
**Date checked:** 2026-11-02.
**Context:** The site needs an online IDE for DSA problem pages, but user-submitted code is untrusted and cannot be executed with access to app secrets, Neon, or Vercel environment values. The frontend must keep login gated behind the Run/Submit action, defaulting to `IDE_ENABLED=false` until the owner approves the backend.

**Official reference URLs (same sources reviewed for this ADR; not all were directly fetchable from this sandbox):**
- Judge0 CE: https://ce.judge0.com/ (official API docs)
- Piston API v2: https://piston.readthedocs.io/en/latest/api-v2/ (official API docs)
- Vercel Functions limits: https://vercel.com/docs/functions/limits
- Pyodide: https://pyodide.org/en/stable/
- Date checked: 2026-11-02; these sites returned HTTP 403 from the sandbox, so the URLs are recorded as the authoritative sources to confirm during owner review before any production approval.

| Provider / model | Isolation strength | Ops burden | Cost model | Languages | Latency | Owner must provision |
|---|---|---|---|---|---|---|
| Self-hosted Judge0 CE | Strongest: isolated container, no host secrets, cgroup/namespace isolation | High: Docker host, networking, queueing, sandbox tuning, upgrades | Verify via host + infra cost; no invented prices | C++17, Python, Java, JS, more | Low to medium; depends on queue and container spin-up | Linux VM or Kubernetes worker, Docker runtime, private network, TLS, token, firewall, monitoring |
| Self-hosted Piston | Strong: containerized worker, but narrower APIs than Judge0; still needs dedicated host | Medium-high: worker pool, API gateway, token auth, runtime images | Verify | Python, C++, Java, JS, etc.; depends on installed runtimes | Low to medium | Dedicated worker host, runtime images, private network, API gateway, token, firewall |
| Hosted execution API (vendor) | Strong if provider enforces sandboxing; offloads ops | Low | Verify by vendor pricing and limits; no invented prices | Usually multiple mainstream languages | Low | Vendor account, DNS/TLS, API token, firewall policy, cost approval |
| In-browser WASM (Pyodide, etc.) | Weak for C++; not suitable for trusted submit or hidden tests | Low on site code, but high on browser trust | No runtime cost for user code, but browser CPU limits apply | Python-like sandbox only; C++ not realistically viable | Very low | No backend service; only browser/client code |
| Mock provider | None; intentionally non-executing | Minimal | None | Not real | Instant | None; only for T2-T12 dev/test work |

**Recommendation:** Prefer a dedicated, isolated execution backend (Judge0 CE or Piston) with a short-lived job API, no outbound egress to the public internet except the allowed upstream, and no secrets mounted at all. The backend must run on a dedicated host or pod that does not have access to Neon, Vercel env vars, GitHub keys, SMTP credentials, or the app database. The site should default to `IDE_PROVIDER=mock` until the owner approves the actual backend; T2-T12 may proceed with the mock provider, but production stays behind `IDE_ENABLED=false` until this gate is signed off.

**Reasoning:**
- Untrusted user code must not reach any system with secrets or production infrastructure.
- The site only needs one narrow capability: compile/execute a single-language submission with a timeout and a normalized result model; it does not need a general-purpose VM or privileged host.
- A dedicated judge host keeps the app small, auditable, and easier to constrain than a public, broad-scope sandbox.
- In-browser WASM is useful for previews and demos, but it is not a safe choice for trusted submit flows or C++ execution.
- Vercel serverless functions are too short-lived and stateless for long-running judge tasks; the execution host should be separate from the web tier.

**Threat model:** If user code escapes the sandbox, the host must be a clean, secret-free worker. It must not mount or access: Neon/Prisma credentials, Vercel environment variables, any admin tokens, GitHub PATs, SMTP keys, or any other non-public service credentials. The sandbox host should have restricted egress only to the execution API itself and the public package mirrors required by the language runtime; no access to private networks, no direct DB access, and no secrets in `/etc/environment` or mounted volumes. The app still keeps login required only when the user clicks Run or Submit; user code is never trusted and is never executed in the same runtime as the app secrets.

**ExecutionProvider interface (TypeScript signatures only):**
```ts
export type ExecutionVerdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT'
  | 'MEMORY_LIMIT'
  | 'RUNTIME_ERROR'
  | 'COMPILE_ERROR'
  | 'INTERNAL_ERROR';

export interface ExecutionInput {
  language: 'cpp' | 'python' | 'java' | 'javascript';
  source: string;
  stdin?: string;
  expectedOutput?: string;
  timeoutMs?: number;
  memoryMb?: number;
  maxOutputBytes?: number;
  maxProcesses?: number;
  metadata?: Record<string, string>;
}

export interface ExecutionRef {
  provider: 'mock' | 'judge0' | 'piston' | 'hosted';
  id: string;
}

export interface ExecutionResult {
  verdict: ExecutionVerdict;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  exitCode?: number;
  elapsedMs?: number;
  memoryMb?: number;
  providerRef: ExecutionRef;
  createdAt: string;
  finishedAt?: string;
}

export interface ExecutionProvider {
  createExecution(input: ExecutionInput): Promise<ExecutionRef>;
  getExecution(providerRef: ExecutionRef): Promise<ExecutionResult>;
}
```

**Config via env var names only:**
- `IDE_ENABLED` — default `false`; production must remain false until owner gate passes.
- `IDE_PROVIDER` — default `mock`; values: `mock`, `judge0`, `piston`, `hosted`.
- `IDE_PROVIDER_URL` — execution backend base URL.
- `IDE_PROVIDER_TOKEN` — API token for the backend; not stored in the app bundle.
- `IDE_TIMEOUT_MS` — default per-run cap.
- `IDE_MEMORY_MB` — default memory limit.
- `IDE_MAX_OUTPUT_BYTES` — cap for stdout/stderr.
- `IDE_MAX_PROCESSES` — sandbox process cap.
- `IDE_MAX_QUEUE_SECONDS` — queue timeout for polling.
- `IDE_DEFAULT_LANGUAGE` — default language for the editor.

**What the owner must do before production approval:**
1. Provision a dedicated execution host (Linux VM or K8s worker) with Docker and a runtime image set for at least C++17, Python, and one JVM/Node language.
2. Configure DNS/TLS for the judge API domain (HTTPS only), plus a separate public/private network boundary; it must not share the Vercel app's private network.
3. Issue a dedicated API token and restrict the host to a small allowlist of IPs or private network routes; no secrets on that host.
4. Add firewall rules that block outbound access to internal services and the app database; only the minimum judge dependencies and package mirrors should be reachable.
5. Approve cost and operational ownership: compute cost, alerting, backups, image patching, and incident response.
6. Sign off on the backend architecture before enabling `IDE_ENABLED=true` or before returning any real execution result to end users.

**Production release gate policy (verbatim):**
> Production release gate (owner policy, mandatory):
> The Online IDE reaches production ONLY when ALL of these are true: (1) tasks T0-T14 are complete and merged into dev; (2) full CI is green on dev, including the E2E, accessibility and security tests and the regression test proving the site is unchanged when IDE_ENABLED=false; (3) the real sandbox is provisioned and its smoke test passed; (4) the owner tested Run and Submit manually on a Vercel Preview while signed in; (5) the owner explicitly approves.
> Until then everything stays behind IDE_ENABLED=false (default) and must be invisible and inert in production: no UI, and the APIs return 404. Never set or suggest setting IDE_ENABLED=true in Production before the gate passes.
> Releases dev -> main are done only by the owner. If dev must be released for another reason before the IDE is complete, first prove with the regression test that IDE_ENABLED=false makes the IDE completely invisible and inert.

**Decision:** Keep the online IDE completely invisible and inert in production until the owner approves the backend and the full release gate passes. Login is required only when the user clicks Run or Submit; the app still defaults to `IDE_ENABLED=false` and the real backend is never enabled without explicit approval.

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
**Decision:** Upgrade Prisma 6 to stable `7.10.1` with the official v7 generator/config path and `@prisma/adapter-pg@7.10.1`.
**Reason:** Prisma v7 requires a driver adapter and explicit generated-client output; the existing app is PostgreSQL and CI already provides a disposable PostgreSQL service. Keep the existing three migration SQL files unchanged.
**Impact:** Move the connection URL to root `prisma.config.ts`, keep `postinstall: prisma generate`, update all generated-client imports, and validate install/generate/migrate/build/runtime adapter behavior only in CI against `localhost:5432`. Never run migration commands against Neon or production. Prisma v7 uses node-postgres pool defaults; do not validate production connection behavior as part of this PR.

---
**Auth.js v5 follow-up:** Remove the `@auth/core` compatibility override when migrating to Auth.js v5.
**Reason:** The compatibility override is tied to the current NextAuth v4 setup and should not be carried into an Auth.js v5 migration without explicit verification.

---
**Stage 3 PR #42 CI evidence:** Full run [41114978943](https://github.com/SHIV1804/Portfolio/actions/runs/41114978943) passed postinstall and explicit Prisma 7.10.1 generation, disposable PostgreSQL migrations, TypeScript, lint, build, and Playwright (211 passed, 1 skipped). The Auth.js Prisma adapter create/read/delete smoke test ran against the job-scoped CI database. Two earlier CI findings were fixed: required `AdapterUser.id`, then a generated Prisma enum import in a client component that pulled in `node:module`; browser-safe enum constants now live in `shared/lib/post-status.ts`. No Neon or production database was touched.

---
**Decision:** Upgrade ESLint to `10.13.0` in a dedicated Stage 3 PR and pair it with `eslint-config-next@16.4.3`.
**Reason:** Next.js 16.4.3 officially documents ESLint 10 support, and the config's peer range is `eslint >=9.0.0`. CI's Node 22.23.4 satisfies ESLint 10's Node minimum. The repo already uses flat config; existing `@typescript-eslint` 8.62.1 peer ranges include ESLint 10.
**Impact:** The config's nested React/import/accessibility plugins still declare peer ranges ending at ESLint 9 and npm warns while overriding these peers. A local ESLint run succeeds; full CI must pass before merge, and the peer warnings must remain documented.

---
**Auth.js v5 follow-up:** Remove the `@auth/core` compatibility override when migrating to Auth.js v5.
**Reason:** This override is a NextAuth v4 compatibility measure and must not be carried into the v5 migration without explicit verification.

---
**Stage 3 PR #41 CI evidence:** Full run [40943258369](https://github.com/SHIV1804/Portfolio/actions/runs/40943258369) passed dependency installation, Prisma generation, disposable-database migrations, TypeScript, lint, build, and Playwright (210 passed, 1 skipped). npm emitted peer override warnings for nested ESLint plugins whose declared ranges end at ESLint 9; the lint and full CI jobs nevertheless passed.

---
**Stage 3 item 5 — TypeScript 7.0.2 blocked:** The latest `typescript-eslint` parser/plugin release (8.72.1) declares TypeScript `>=4.8.4 <6.1.0`, excluding the requested 7.0.2. Next 16.4.3 itself permits TypeScript 7, but the repository's TypeScript-aware ESLint parser does not. Do not upgrade until tooling support or a separately tested TS 6 API alias strategy is available.
**Decision:** Upgrade `framer-motion` to `14.7.1` in its own Stage 3 PR.
**Reason:** The official Motion upgrade guide reports no breaking changes for the relevant JavaScript API in Motion 13 or 14. This repository uses only the React `motion` component API through `framer-motion`; it does not use the Motion One APIs called out in the guide (`animate`, `scroll`, `inView`, `stagger`, or `glide`).
**Impact:** The affected usage is limited to `widgets/dsa/ui/visualizers/TwoPointersVisualizer.tsx`, `SlidingWindowVisualizer.tsx`, `BinarySearchVisualizer.tsx`, and `widgets/dsa/ui/flagship/ArrayBox.tsx`. CI must exercise the DSA pages and reduced-motion tests before merge.

**Stage 3 evidence rule:** `@types/node` remains unchanged until the Vercel project Node setting is obtained from authenticated project evidence. CI is confirmed to use Node 22; no Node 26 assumption is permitted.

---
**Auth.js v5 follow-up:** Remove the `@auth/core` compatibility override when migrating to Auth.js v5.
**Reason:** This override is a NextAuth v4 compatibility measure and must not be carried into the v5 migration without explicit verification.

---
**Stage 3 PR #39 CI evidence:** Run [40940889046](https://github.com/SHIV1804/Portfolio/actions/runs/40940889046) passed TypeScript, lint, build, and the full Playwright suite (212 passed, 1 skipped), including the actual DSA detail and flagship routes that exercise all Framer Motion consumers.
**Decision:** Upgrade `@hookform/resolvers` to `6.0.2` in its own Stage 3 PR.
**Reason:** The official v6.0.2 release is a bug-fix release (TypeBox escaped-field-name validation errors). The repository uses only `zodResolver(contactSchema)` and the documented resolver signature remains compatible with the existing Zod v4 schema and React Hook Form setup.
**Impact:** The only runtime usage is `features/contact-form/ui/ContactForm.tsx`; the server-side validation in `app/api/contact/route.ts` remains unchanged. CI must exercise the contact-form tests before merge.

**Stage 3 evidence rule:** `@types/node` remains unchanged until the Vercel project Node setting is obtained from authenticated project evidence. CI is confirmed to use Node 22; no Node 26 assumption is permitted.

---
**Auth.js v5 follow-up:** Remove the `@auth/core` compatibility override when migrating to Auth.js v5.
**Reason:** This override is a NextAuth v4 compatibility measure and must not be carried into the v5 migration without explicit verification.

---
**Stage 3 PR #40 CI evidence:** Full run [40941772607](https://github.com/SHIV1804/Portfolio/actions/runs/40941772607) passed TypeScript, lint, build, and the Playwright suite (210 passed, 1 skipped), including the contact-form validation flows using `zodResolver`.

---
**Decision:** Upgrade the Lighthouse devDependency to `13.6.0` as the first Stage 3 dependency change.
**Reason:** Lighthouse 13.6.0 removes the Lighthouse 12-era high-severity transitive findings and is compatible with the repository's CLI-only usage. Official release notes require Node `>=22.19`; CI requests Node 22, so CI's resolved Node 22 patch must satisfy that engine requirement. The sandbox's Node `22.13.0` reports `EBADENGINE`, although installation and the application build remain functional.
**Impact:** No application script or workflow invokes Lighthouse. Any future Lighthouse CLI use must run on Node `>=22.19`.


**Decision:** Pin `@playwright/test` exactly at `1.61.1` during Stage 2 safe-range updates.
**Reason:** The required tolerated-abort regression test passed on 1.61.1 but failed consistently on 1.64.1 in CI and locally: the delayed navigation produced no `requestfailed` event or NextAuth `CLIENT_FETCH_ERROR`; the 1.64.1 capture instead showed 200 session responses and `requestfinished` events. This changes the behavior the test is designed to verify, so the package is reverted rather than weakening the assertion.
**Impact:** Playwright 1.64.1 requires a separately designed test/observer investigation before adoption; the remaining approved safe-range updates proceed independently.

---
**Decision:** Keep the npm override forcing `@auth/core` to `0.41.3`.
**Reason:** `npm install`, TypeScript, and dependency resolution all passed with the override, and the audit count fell from 32 to 29 with both critical advisories removed. `next-auth@4.24.15` resolves to the overridden `@auth/core@0.41.3` in the installed tree. `shared/lib/auth.ts` configures GitHub OAuth only; it has no email provider.

---
**Decision:** Accept the current 19 moderate `npm audit --package-lock-only` findings as development-tooling-only advisories during Stage 3.
**Reason:** The findings are `glob` and `minimatch` advisories reached through ESLint, TypeScript-ESLint, Lighthouse, and Sentry tooling. Patched majors `minimatch@11.0.3` and `glob@14.0.3` would break the current lint/toolchain compatibility, while npm's suggested forced downgrades are not acceptable. The production-only audit (`npm audit --package-lock-only --omit=dev`) is the security metric for deployed dependencies and remains 0.
**Impact:** Do not run `npm audit fix --force` and do not add `glob`/`minimatch` overrides. Revisit when the surrounding toolchain supports the patched majors.

---
**Decision:** Declare `prisma@7.10.1` and `dotenv@17.2.3` in `dependencies`, not `devDependencies`, and declare each package exactly once.
**Reason:** The merge combined the Prisma branch's `devDependencies` entries with the predecessor branch's existing runtime `prisma` entry, leaving two Prisma declarations with incompatible ranges. The Prisma CLI is invoked by the `postinstall` script and `prisma.config.ts` imports `dotenv`; placing both in runtime dependencies avoids relying on whether the deployment platform installs development dependencies during its build.
**Impact:** The manifest now has one exact Prisma 7 declaration, one `@prisma/client@7.10.1` declaration, and runtime `dotenv`. Vercel's exact install behavior for `devDependencies` in this project remains unverified and must not be assumed.
