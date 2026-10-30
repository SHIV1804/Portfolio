# MANUS_CONTEXT.md — Handoff & Working Memory (v2, merged)

> **Purpose.** Single source of truth for the dependency-upgrade / test-hardening work on `SHIV1804/Portfolio`. If your context runs out or the sandbox resets, a fresh agent must be able to continue from this file alone.
>
> **Last verified:** 2026-10-31 against GitHub (git refs). PR #37 is MERGED into `security/dependency-upgrades` (head `3b9e5d3`); the owner has given the go-ahead for the re-stack (section 10A). **Re-run section 12 before acting.**
>
> **Legend.** ✅ verified from git/GitHub by the reviewer. 🟡 reported by Manus or CI, not independently re-checked. ❓ unknown / needs the owner.
>
> **Location.** Branch `docs/manus-handoff` (based on `main`, **never merge it**), path `docs/handoff/MANUS_CONTEXT.md`. This v2 file replaces the shorter version already on that branch (head `1e27cf8`). The shorter version dropped the safety rules, decisions, audit table, session-test rules, re-verification checklist and the out-of-context protocol; they are restored here.

---

## 0. How to use this file (read first)

1. Read sections 1–5 fully. Then run section 12 and paste the output.
2. After **every** meaningful action (commit, PR update, CI result, decision, blocker), append an entry to section 13 and update sections 5, 10 and 11. Commit and push this file to `docs/manus-handoff` each time and confirm with `git ls-remote origin refs/heads/docs/manus-handoff`.
3. Never put secrets, tokens or `.env` values in this file.
4. Do not claim anything works unless you ran it and have the output. Mark unknowns ❓.

---

## 1. Project facts

| Item | Value |
|---|---|
| Repo | https://github.com/SHIV1804/Portfolio |
| `main` | `c97b69a` (merge of PR #22, 2026-10-25) ✅. **Production deploys from `main`** (latest GitHub Production deployment is `c97b69a`; the migration workflow guard requires `refs/heads/main`) 🟡 |
| `dev` | `b4aa696` ✅ — 2 commits behind `main` (nothing on `dev` that `main` lacks) |
| Remote heads | 44 ✅ (37 original + `chore/safe-range-dependency-updates` + 5 Stage 3 branches + `docs/manus-handoff`) |
| Package manager | **npm only** on the PR branches (pnpm files removed in PR #23). `main` still has both `package-lock.json` and `pnpm-lock.yaml`. |
| Tests | Playwright, Chromium project only, against `next dev` ✅ |
| Auth | next-auth **v4**, `GithubProvider` only, `PrismaAdapter` ✅ |
| DB | Prisma 6 on `main`; Neon Postgres in production |
| Related repo | `SHIV1804/dsa-solutions` — separate, unrelated to this work |

Docs in the repo you must follow: `AGENTS.md`, `CONVENTIONS.md`, `PROJECT_CONTEXT.md`, `DECISIONS.md`, `TASKS.md`. Policy: every behavior change ships with tests in the same PR; PR descriptions list tests added and the CI result; update `TASKS.md` / `DECISIONS.md` when work is done or a non-obvious choice is made.

---

## 2. Non-negotiable rules

- Never force-push. Never rewrite shared history.
- **Never merge a PR.** Open or update PRs and stop for owner approval.
- **Never run the production migration workflow. Never touch production or Neon. Never rerun workflow run `40092064802`.** Prisma generation, migrations and adapter tests use only the disposable PostgreSQL service in GitHub Actions.
- Never print secrets, tokens or `.env` values.
- One PR per item so failures can be bisected.
- Paste real command output. If something cannot run in the sandbox, say so and rely on GitHub Actions CI (link the run).
- Unclear requirement → choose the safest option, record it in `DECISIONS.md`, and tell the owner.
- Do not rename or delete any remote branch without explicit owner authorization.

---

## 3. Environment limitations

- `prisma generate` is blocked in network-restricted sandboxes (`binaries.prisma.sh` returns 403). Use CI.
- `GITHUB_TOKEN` is unset locally → 2 targeted Playwright tests fail with `Missing GITHUB_TOKEN or username in siteConfig`. Expected; the observer correctly does not ignore it. CI has the config.
- The unauthenticated GitHub REST API rate-limits quickly. Prefer `git fetch` / `git log` / `git diff`.
- Shallow or single-branch clones hide branches. Use `git remote set-branches origin '*' && git fetch origin`.
- The private Vercel and Neon dashboards are not accessible to you (login redirect). Anything that depends on them is ❓ and needs the owner.

---

## 4. Rules for the session-error test (do not break)

Test `navigation does not create console errors` in `tests/assets/assets-and-console.spec.ts`, using `tests/helpers/session-observer.ts`.

- Captured real Chromium console text for an aborted session fetch:
  ```text
  [next-auth][error][CLIENT_FETCH_ERROR] 
  https://next-auth.js.org/errors#client_fetch_error Failed to fetch {error: Object, url: /api/auth/session, message: Failed to fetch}
  ```
- `isAbortedSessionConsoleError()` is exported and unit-tested against that exact string (deterministic, no browser abort needed).
- One shared console ignore list: `ResizeObserver`, `Non-Error promise rejection`, `Uncaught (in promise)`.
- Abort tolerance is **count-based** (one tolerated `net::ERR_ABORTED` per matching console error). The navigation test asserts **zero** `net::ERR_ABORTED` session failures and uses `waitForLoadState('networkidle')` after each navigation, because an additional `/api/auth/session` fetch (likely `SessionProvider` focus/visibility refetch) can start after the startup fetch. **The exact trigger is unconfirmed** ❓ (`security/bisect-session-abort-cause`, `a4648d2`, only tried `refetchOnWindowFocus={false}` and has no recorded CI result).
- `@playwright/test` is **pinned to exactly `1.61.1`** (in PR #37). On 1.64.1 the delayed-navigation abort test stopped producing a `requestfailed` event / `CLIENT_FETCH_ERROR`. Do not bump Playwright without re-verifying the abort tests.
- Do not weaken the zero-abort assertion or widen the ignore list to make a test pass.

---

## 5. Current state of work

### Pull requests (all open, none merged)

| PR | Branch | Target | Head ✅ | CI 🟡 |
|---|---|---|---|---|
| #23 | `security/dependency-upgrades` | `dev` 🟡 (reported by Manus; reviewer could not verify the base via API) | `6e90cd6` | run 40776871932 green |
| #37 | `chore/safe-range-dependency-updates` | `security/dependency-upgrades` | `c80230d` — **MERGED** ✅ (merge commit `3b9e5d3`, 2026-10-31) | run 40780697711: 211 passed, 1 skipped |
| #38 Lighthouse 13 | `chore/upgrade-lighthouse-13` | `security/dependency-upgrades` | `40fcb8f` | run 40937913936: 210 passed, 1 skipped |
| #39 Framer Motion 14 | `chore/upgrade-framer-motion-14` | `security/dependency-upgrades` | `7d8c9f6` | run 40940889046: 212 passed, 1 skipped |
| #40 Resolvers 6 | `chore/upgrade-hookform-resolvers-6` | `security/dependency-upgrades` | `dbb7b22` | run 40941772607: 210 passed, 1 skipped |
| #41 ESLint 10 | `chore/upgrade-eslint-10` | `security/dependency-upgrades` | `beeea2f` | run 40943258369: 210 passed, 1 skipped |
| #42 Prisma 7.10.1 | `chore/upgrade-prisma-7` | `security/dependency-upgrades` | `13a82e3` (code tested at `ad31ca2`; later commit is docs only) | run 41114978943: 211 passed, 1 skipped |

**⚠ Integration problem (✅ verified by reviewer):** PRs #38–#42 all fork from `6e90cd6`, which is now 4 commits behind the new base `3b9e5d3` (PR #37 merged). Each of them conflicts with PR #37 (`package.json`, `package-lock.json`, `DECISIONS.md`; the resolvers branch conflicts only in `DECISIONS.md`). Every Stage 3 CI run tested its change **without** PR #37's `@auth/core` override, Playwright pin and safe-range updates. The combined stack is untested until the re-stack in section 10A is done.

**Intended merge path (owner decides):** #37 → into `security/dependency-upgrades`; then #23 into `dev`; then `dev` → `main` (production). Before `main`: check the Vercel preview and the Vercel settings in section 10 (owner actions).

### Stage 1 (PR #23) — summary
`next` 16.2.10 → 16.4.3, `react`/`react-dom` 19.2.4 → 19.3.1, `next-auth` 4.24.15, `@auth/prisma-adapter` 2.11.3, overrides for `gray-matter/js-yaml` (3.15.2) and `nanoid` (3.3.18), pnpm metadata removed, `useTerminal.ts` hydration fix, session observer + refactored tests.

### Stage 2 (PR #37) — summary
Safe-range updates (Tailwind 4.3.3, `@types/react*` 19.3.0, `zod` 4.6.7, `shiki` 4.5.0, `resend` 6.35.0, `recharts` 3.10.1, `react-hook-form` 7.91.0, `geist` 1.8.2, `lucide-react` 1.63.0, `tailwind-merge` 3.7.0, `tsx` 4.23.15, `rehype-pretty-code` 0.14.5, `remark-gfm` 4.0.1, `remark-rehype` 11.1.2); Playwright pinned 1.61.1; matcher unit test; `npm audit fix`; `@auth/core` override 0.41.3.

### Stage 3 — per-item results (🟡 from Manus' report, spot-checked)
- **#38 Lighthouse 12 → 13.6.0.** Needs Node >=22.19 (CI resolved 22.23.4). No app script or workflow invokes Lighthouse. Audit 38 → 8.
- **#39 Framer Motion 12 → 14.7.1.** Consumers: `TwoPointersVisualizer`, `SlidingWindowVisualizer`, `BinarySearchVisualizer`, `ArrayBox`. Focused DSA page tests added to coverage. Audit unchanged (38).
- **#40 `@hookform/resolvers` 5 → 6.0.2.** Only `zodResolver(contactSchema)` in `features/contact-form/ui/ContactForm.tsx`. Audit unchanged.
- **#41 ESLint 9 → 10.13.0** with `eslint-config-next@16.4.3`. npm prints peer-override warnings for nested plugins still declaring ESLint 9; install, lint, build and CI pass. Audit 38 → 37.
- **#42 Prisma 6 → 7.10.1** (not the 8 RC). ESM (`"type": "module"`), `prisma-client` generator output `generated/prisma` (gitignored), `prisma.config.ts` with `dotenv`, runtime `PrismaPg` adapter (`@prisma/adapter-pg@7.10.1`), enum moved to `shared/lib/post-status.ts`, adapter CRUD smoke test (`tests/prisma/prisma-adapter-smoke.spec.ts`, refuses non-local hosts). Two CI fixes were needed (`AdapterUser.id`, Turbopack `node:module` error). Audit unchanged (38).
- **TypeScript 7.0.2 — BLOCKED ✅.** `typescript-eslint` / `@typescript-eslint/parser` 8.72.1 require `typescript >=4.8.4 <6.1.0`. TypeScript **6.0.3** exists and is inside that range → a separate TS 5 → 6.0.3 step is possible.
- **`@types/node` — BLOCKED on owner input.** CI uses Node 22 (22.23.4). The Vercel Node setting is ❓. Do not guess.

### Stage 4 findings
- Production deploys from `main` 🟡. The Vercel install command / package-manager / Node setting is ❓ (no `vercel.json`, no `packageManager`, no `engines` in the repo).
- Workflow run `40092064802`, attempt 1: failed at the Neon backup step before migrations; `NEON_API_KEY` and `NEON_PROJECT_ID` were empty; HTTP 400. Attempt 2 was `waiting` at verification, probably for `production` environment approval. **Do not rerun or modify.** Owner should cancel/inspect it and add the two secrets.
- 33 stale branch candidates (none deleted):
  ```text
  bisect-do-not-merge-terminal-history-fix, chore/migrate-workflow, chore/sync-main-into-dev, ci/pr-checks,
  content/assets, content/bio, content/bio-final, content/og-image, content/og-image-compressed,
  content/placeholder-projects, docs/project-context, docs/testing-policy, feature/post-deletion,
  fix/dsa-card-clickable, fix/launch-blockers, fix/max-sum-path, merge/main-into-dev,
  security/bisect-a-compatible, security/bisect-b, security/bisect-baseline, security/bisect-c,
  security/bisect-c-terminal-readiness, security/bisect-d-session-provider, security/bisect-next-1641,
  security/bisect-next-1642, security/bisect-prod-start, security/bisect-production,
  security/bisect-session-abort-cause, security/bisect-webpack, test/db-resilience-check,
  test/post-deletion-e2e, test/post-deletion-e2e-hardening, test/stabilize-e2e
  ```
  Keep `security/bisect-session-abort-cause` until the abort cause is documented in `DECISIONS.md`. Propose tagging each as `archive/<name>` before any deletion (owner authorizes).

---

## 6. Decisions made (mirror of `DECISIONS.md`; keep in sync)

1. npm is the only package manager (pnpm lockfile/workspace removed on the PR branches).
2. next-auth stays on v4 (v5 is beta-only). Do not migrate to Auth.js v5 in this work.
3. One shared console-error ignore list; matcher uses the real captured Chromium text; count-based abort tolerance.
4. `networkidle` after each navigation in the navigation test; cause of the extra session fetch unconfirmed.
5. `@playwright/test` pinned `1.61.1` (1.64.1 changed behavior of the abort-coverage test).
6. `@auth/core` override `0.41.3`: `next-auth@4.24.15` has an exact peer dependency on `@auth/core@0.34.3` (flagged critical); `@auth/prisma-adapter@2.11.3` already uses 0.41.3. It is an unsupported peer combination that passed `tsc` and full CI. **Remove it when migrating to Auth.js v5.** No email provider is used (`GithubProvider` only).
7. Lighthouse 13 requires Node >=22.19; any future Lighthouse CLI invocation must use it.
8. TypeScript 7 is blocked by the `typescript-eslint` peer range; TS 6.0.3 is the next candidate.
9. ESLint 10 accepted with nested-plugin peer-override warnings.
10. Prisma 7: stable 7.10.1 only (not 8 RC); `@auth/prisma-adapter` 2.11.3 retained with a narrow type cast; adapter tests refuse Neon/non-local hosts.
11. A duplicate local commit was discarded rather than force-pushed. No force-push has ever been used.

---

## 7. Security audit status (`npm audit --package-lock-only`)

| State | Total | Crit | High | Mod | Low |
|---|---:|---:|---:|---:|---:|
| `main` lockfile ✅ | 44 | 4 | – | – | – |
| PR #23 baseline ✅ | 38 | 2 | 15 | 20 | 1 |
| PR #37 final ✅ | 29 | 0 | 10 | 19 | 0 |
| PR #38 alone (Lighthouse 13) 🟡 | 8 | 2 | 4 | 1 | 1 |
| PR #41 alone (ESLint 10) 🟡 | 37 | 2 | 14 | 20 | 1 |
| PR #37 + Lighthouse 13, lockfile-only estimate ✅ (reviewer) | **0** | 0 | 0 | 0 | 0 |

The criticals on PRs #38–#42 are the `@auth/core` peer issue that PR #37's override removes. `npm audit fix --force` may suggest `next-auth@4.24.7` — that is a **downgrade; ignore it**. The 0 estimate must be confirmed by a real run after the re-stack.

---

## 8. Latest versions on npm (as of 2026-10-28; re-check with `npm view <pkg> version`)

| Package | After PRs | Latest | Note |
|---|---|---|---|
| @playwright/test | 1.61.1 (pinned) | 1.64.1 | Do not bump without re-verifying abort tests |
| prisma / @prisma/client | 7.10.1 (PR #42) | 7.10.1 | 8.0.0-rc.28 exists — do not use |
| typescript | ^5 | 7.0.2 | Blocked; use 6.0.3 as the next step |
| eslint | 10.13.0 (PR #41) | 10.13.0 | |
| @types/node | ^20 | 26.6.5 | Match the real Node version, not the latest |
| framer-motion | 14.7.1 (PR #39) | 14.7.1 | |
| @hookform/resolvers | 6.0.2 (PR #40) | 6.0.2 | |
| lighthouse | 13.6.0 (PR #38) | 13.6.0 | Node >=22.19 |
| next-auth | 4.24.15 | 4.24.15 | Stay on v4 |

---

## 9. Facts verified about the repo

- `main`'s `package.json` was last changed on 2026-07-18 before PR #23. The upgrade work lives on PR branches.
- The session-test file had three earlier fixes on `main` (2026-10-17 ×2; 2026-10-20 `a4a469d`).
- `prisma.config.ts` (PR #42) reads `process.env.DATABASE_URL`. The `migrate-production.yml` workflow maps `secrets.DATABASE_URL_DIRECT` **into** `DATABASE_URL` for `prisma migrate status` and `deploy`. So the config and workflow are already compatible. **Do not change `prisma.config.ts` to read `DATABASE_URL_DIRECT`** — that would break CI and local use.
- `shared/lib/prisma.ts` (PR #42) silently falls back to `postgresql://ci:ci@127.0.0.1:5432/portfolio_ci` when `DATABASE_URL` is unset. That is a production footgun (to be fixed, section 10).

---

## 10. Remaining work (ordered)

### Owner-only actions (you cannot do these)
1. Inspect and cancel workflow run `40092064802` (attempt 2 `waiting`); add `NEON_API_KEY` and `NEON_PROJECT_ID` secrets before any new run.
2. In Vercel: read **Install Command** and **Node.js Version**; confirm `DATABASE_URL` is set. Tell Manus the Node version.
3. ~~Merge PR #37 into `security/dependency-upgrades`~~ — **done** (`3b9e5d3`).

### A. Re-stack Stage 3 (**GO — the owner confirmed PR #37 is merged; base is `security/dependency-upgrades` @ `3b9e5d3`**)
Rebase one at a time, as a chain, in this order: `lighthouse-13` → `hookform-resolvers-6` → `framer-motion-14` → `eslint-10` → `prisma-7`. Each PR targets the previous branch. Regenerate `package-lock.json` with `npm install` (never hand-edit it); keep both sides in `DECISIONS.md` / `TASKS.md`. For each: run `tsc`, lint, build and the full Playwright suite in CI, report `npm audit`, update and push this file. The final stack must show **0 critical**. Do not merge.

### B. Prisma 7 follow-up (PR #42, after re-stack; disposable CI Postgres only)
- Remove the silent localhost fallback in `shared/lib/prisma.ts`: fail loudly when `DATABASE_URL` is missing at runtime while keeping `next build` and CI working.
- Inventory every tracked `.js`, `.cjs`, `.mjs` file and package/workflow script affected by `"type": "module"`; run each and record real output.
- Verify (do **not** change) that `prisma.config.ts` plus `migrate-production.yml` remain compatible, as in section 9. Do not execute the workflow.

### C. New PRs after the stack is ready
- TypeScript 5 → **6.0.3**: confirm Next 16.4.3 support and the `typescript-eslint` peer range; run full CI.
- `@types/node`: wait for the owner's Vercel Node version; match it against CI (Node 22).

### D. Report-only
- Branch-retirement proposal (`archive/<name>` tags). No deletions.
- Placeholders from `TASKS.md` needing owner input: second case study, Log Analyser content, bio, `/resume.pdf`, OG images.

---

## 11. NEXT ACTION (keep current)

```text
NEXT ACTION: PR #37 is merged (security/dependency-upgrades @ 3b9e5d3). Start section 10A now with
chore/upgrade-lighthouse-13 rebased onto 3b9e5d3. Do one branch at a time; stop and report after each.
```

---

## 12. Re-verification checklist (run first, paste output)

```bash
git remote set-branches origin '*' && git fetch origin
git ls-remote --heads origin | wc -l
git ls-remote origin refs/heads/docs/manus-handoff
git log origin/main --oneline -3
git log origin/security/dependency-upgrades --oneline -3
git merge-base --is-ancestor origin/chore/safe-range-dependency-updates origin/security/dependency-upgrades && echo "#37 merged" || echo "#37 NOT merged"
for b in lighthouse-13 hookform-resolvers-6 framer-motion-14 eslint-10 prisma-7; do echo "$b $(git rev-parse --short origin/chore/upgrade-$b)"; done
git status && git stash list
```

Confirm in `package.json` on the branch you work from: `@playwright/test` is exactly `1.61.1`, `overrides` has `"@auth/core": "0.41.3"`, `next` 16.4.3, `react` 19.3.1, `next-auth` 4.24.15.

---

## 13. Progress log (append-only)

| Date | Entry |
|---|---|
| 2026-10-27 | PR #23 created: dependency upgrades, terminal fix, session observer. |
| 2026-10-28 | Stage 1 review fixes (`6e90cd6`); CI green. Stage 2 PR #37 created (`c80230d`); Playwright pinned 1.61.1; `@auth/core` override; audit 38 → 29, criticals 0. |
| 2026-10-30/31 | Stage 3 PRs #38–#42 opened (branches off `6e90cd6`); TypeScript 7 and `@types/node` blocked; Stage 4 findings reported. |
| 2026-10-31 | Reviewer verified: handoff branch exists (`1e27cf8`), five Stage 3 SHAs match, #37 not merged, all five Stage 3 branches conflict with #37, `prisma.config.ts` vs workflow already compatible. v2 of this file written. |
| 2026-10-31 | PR #37 merged into `security/dependency-upgrades` (`3b9e5d3`); owner gave the explicit go-ahead for section 10A. |
| _next_ | _append here_ |

---

## 14. If you are about to run out of context

1. Update sections 5, 10, 11 and 13 with exact state (branch, head SHA, CI link + summary, what is half-done).
2. Commit and push this file to `docs/manus-handoff`; confirm with `git ls-remote`.
3. Commit any WIP to the item's own branch (prefix `wip:`) and push; never leave uncommitted work.
4. Report to the owner: branch, head commit, PR number, CI link, what is verified vs not, and the single NEXT ACTION.
