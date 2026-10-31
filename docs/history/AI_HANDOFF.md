# AI_HANDOFF.md

## Current State
The project now includes a production-grade blog, a live GitHub dashboard, and an interactive Terminal easter egg. The project also features a robust E2E testing suite using Playwright. All features follow FSD architecture and are verified with successful builds and tests.

## Work Completed This Session (2026-07-11)
- **Bug 1 Fix (Missing Header)**: Moved `<Header />` and `<Footer />` into the root `app/layout.tsx` to ensure site chrome is present on all routes, including `/blog/[slug]` and `/dsa/[pattern]/[slug]`. Removed duplicate manual instances in `app/page.tsx`.
- **Bug 2 Fix (Mobile Menu)**: Implemented a fully accessible mobile hamburger menu in `widgets/header/ui/Header.tsx`.
    - Uses `lucide-react` icons (Menu/X).
    - Features click-outside and Escape key closing.
    - Keyboard accessible with focus management.
    - Matches terminal aesthetic with `bg-background/95` and `backdrop-blur`.
- **Contact Form Audit**: Verified `app/api/contact/route.ts` implementation. Noted that the live site at `portfolio-shivam.vercel.app` is currently an outdated version, which explains the "Send" button issues reported. The current Next.js implementation is ready but requires `RESEND_API_KEY` and `CONTACT_EMAIL` in Vercel.

## Verification Performed
- `npm run build`: Passed successfully.
- `npm run lint`: Passed (0 errors, 11 warnings in tests).
- `npx playwright test`: Passed (150 tests passed).

## Known Issues
- `NEXT_PUBLIC_SITE_URL` env var should be set in production for correct RSS and Sitemap links.
- Case studies still contain unverified claims (inherited from previous state).
- **Env Vars**: `RESEND_API_KEY` and `CONTACT_EMAIL` need to be added to Vercel for the contact form to work in the new version.

## Next Recommended Work
1. **Verify Case Study Claims**: Use the `VERIFIED:` marker protocol for the Log Analyser project.
2. **About Section**: Replace placeholder bio with real content.
3. **Lighthouse**: Run a real audit now that the blog system is added.

## Continuation Prompt
"Read PROJECT_CONTEXT.md and AI_HANDOFF.md. The blog system, GitHub dashboard, and Terminal easter egg are complete. E2E tests are passing. The next priority is addressing the unverified technical claims in the Log Analyser case study or filling in the placeholder About section. Ensure you follow the zero-fabrication rule and FSD architecture."

46	## Work Completed This Session (2026-07-18)
47	- **XSS Security Fix**: Implemented a sanitized Markdown pipeline in `shared/lib/safe-markdown.ts` using `isomorphic-dompurify`. Visitor-submitted posts are now rendered through this safe path, while trusted local MDX files continue to use the standard MDX renderer.
48	- **Content Cleanup**: Replaced draft placeholder text ("[PERSONAL VOICE...]") in the About and Hero sections with a professional "[PLACEHOLDER: bio content pending owner review]" marker.
49	- **Contact Info Consolidation**: Updated `shared/config/site.ts` with real contact details (shivamchourasiya766@gmail.com, LinkedIn). Refactored `app/page.tsx` JSON-LD to use `siteConfig` instead of duplicated hardcoded values.
50	- **Debug Removal**: Deleted the `/auth-test` debug page.
51	- **Build Stability**: Added the missing `"use client"` directive to `shared/lib/useReducedMotion.ts` to fix Turbopack build errors.
52	- **Git History Re-established**: Reconciled the repository state from multiple sessions, establishing GitHub as the single source of truth and maintaining a clean, incremental commit history.
53	
54	## Verification Performed
55	- `npm run build`: Compilation successful (static generation for some pages requires real env vars).
56	- `npm run lint`: Passed with 0 errors.
57	- `npx playwright test`: Navigation tests passed; manual verification of the About section and contact links completed.
58	
59	## Continuation Prompt
60	"Read PROJECT_CONTEXT.md and AI_HANDOFF.md. The security audit and content cleanup are complete. GitHub is now the accurate source of truth. The next priority is to finalize the DSA flagship experience or proceed with the real Lighthouse audit as previously planned."
61	

## Work Completed This Session (2026-08-10)
- **Fix Duplicate Landmarks**: Resolved "strict mode violation" in Playwright tests by removing duplicate `<main>` and `<footer>` tags across multiple routes.
    - **Diagnosis**: Found that `app/layout.tsx` already provided a global `<main>` wrapper, but individual pages in `app/admin`, `app/blog`, `app/dsa`, and `app/projects` were rendering their own nested `<main>` tags.
    - **Fix**: Replaced nested `<main>` tags with `<div>` and changed the "Related Posts" `<footer>` in `app/blog/[slug]/page.tsx` to a `<section>`.
    - **Verification**: Confirmed single `<main>` and `<footer>` elements on `/blog`, `/blog/[slug]`, `/dsa`, and `/projects/log-analyser` via generated HTML inspection.
- **Build/Lint**: `npm run build` and `npm run lint` both passed successfully.


## Work Completed This Session (2026-10-31) — Prisma 7 follow-up
- **Branch integration:** Merged `origin/chore/upgrade-eslint-10` into `chore/upgrade-prisma-7` with normal merge commit `96b26f6`; retained both branches' `DECISIONS.md` and `TASKS.md` entries, combined the ESLint 10 and Prisma 7 package requirements, regenerated `package-lock.json`, and retargeted PR [#42](https://github.com/SHIV1804/Portfolio/pull/42) to `chore/upgrade-eslint-10`.
- **Lazy Prisma client:** Commit `f64062f` removed the fallback `postgresql://ci:ci@127.0.0.1:5432/portfolio_ci`. `shared/lib/prisma.ts` now constructs the Prisma client only on first property access, throws `DATABASE_URL must be set before using Prisma.` when absent, preserves the exported `prisma` API, and keeps the `globalThis` singleton behavior. `tests/prisma/prisma-lazy-import.spec.ts` passed: import with no URL succeeds; first access throws the named error.
- **ESM inventory:** The only tracked `.js`, `.cjs`, or `.mjs` files are `eslint.config.mjs` and `postcss.config.mjs`. Package scripts are `next dev`, `next build`, `next start`, `eslint`, `playwright test`, and `prisma generate`; CI exercises the relevant `npm`, `npx prisma`, TypeScript, lint, build, and Playwright commands. Local lint, TypeScript, targeted lazy-import test, and both builds passed. No ESM breakage was found.
- **Build evidence:** `npm run build` passed with `DATABASE_URL` unset and with a disposable-style localhost URL. Without a URL, the existing fail-soft blog database wrapper logged the explicit missing-variable error and the build completed; with the URL, it logged only the expected unreachable-localhost error and completed. No Neon or production database was used.
- **Configuration verification:** `prisma.config.ts` reads `process.env.DATABASE_URL`; `.github/workflows/migrate-production.yml` maps `secrets.DATABASE_URL_DIRECT` into `DATABASE_URL` for status and deploy steps. That workflow was not executed.
- **Audits:** `npm audit --package-lock-only` reported 19 moderate findings (exit 1); `npm audit --package-lock-only --omit=dev` reported 0 vulnerabilities (exit 0). No audit fix was applied.
- **CI:** The first manual run [41175315476](https://github.com/SHIV1804/Portfolio/actions/runs/41175315476) stopped at `npm ci` because the merged lockfile was out of sync (`effect@3.20.0` versus required `effect@4.1.1`). Commit `6b42dc0` regenerated and verified the lockfile with local `npm ci --ignore-scripts`. Final manual run [41175444023](https://github.com/SHIV1804/Portfolio/actions/runs/41175444023) passed install, Prisma generation, disposable PostgreSQL `migrate deploy`, TypeScript, lint, build, Playwright installation, and the full Playwright suite: **215 passed, 1 skipped**. The Auth.js Prisma adapter CRUD smoke test ran against CI Postgres. No Neon or production migration was executed.


## Work Completed This Session (2026-10-31) — Prisma placement and TypeScript 6
- **PR #42 dependency correction:** On `chore/upgrade-prisma-7`, commit `4d7e813` removed the duplicate `prisma@^6.2.1`/`prisma@7.10.1` declarations, placed exact `prisma@7.10.1` and `dotenv@17.2.3` in `dependencies`, regenerated `package-lock.json`, and added `tests/prisma/package-manifest.spec.ts`. `npm ls prisma @prisma/client --depth=0` resolves both to 7.10.1; the overlap check returned `[]`; local `npm ci --ignore-scripts` and the manifest test passed.
- **PR #42 final CI:** Exact-head run [41177195427](https://github.com/SHIV1804/Portfolio/actions/runs/41177195427) passed Prisma generation, disposable PostgreSQL migration deployment, TypeScript, lint, build, and Playwright with **216 passed, 1 skipped**. Full audit remained 19 moderate findings; production-only audit remained 0. Vercel's devDependency install behavior is still unverified. No Neon or production workflow was used.
- **TypeScript 6 PR:** Created `chore/upgrade-typescript-6` from fixed Prisma head `4d7e813`, with PR [#43](https://github.com/SHIV1804/Portfolio/pull/43) targeting `chore/upgrade-prisma-7`; commit `3c76436` changes only TypeScript to exact `6.0.3` and the lockfile. Official compatibility evidence: [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) lists TypeScript 5.1.0 as the minimum, [Next.js TypeScript docs](https://nextjs.org/docs/app/api-reference/config/typescript) document the project-local compiler and newer TypeScript releases, and [typescript-eslint dependency docs](https://typescript-eslint.io/users/dependency-versions/) support `>=4.8.4 <6.1.0`, covering 6.0.3.
- **TypeScript 6 verification:** Local `npm ci --ignore-scripts`, `npm run lint`, `npx prisma generate && npx tsc --noEmit`, and `npm run build` passed. The initial local type check before Prisma generation reported only missing generated Prisma types; after generation there were no source/type errors, and CI generates Prisma before checking. Exact-head run [41176754088](https://github.com/SHIV1804/Portfolio/actions/runs/41176754088) passed TypeScript, lint, build, disposable migration, and Playwright with **216 passed, 1 skipped**. Both audits: 19 moderate full audit; 0 production-only.
- **Current next action:** Stop for owner review. Do not merge PR #42 or #43, do not start `@types/node`, do not access Neon/production, and do not rerun `40092064802`.

**Final exact-head confirmation:** After the documentation commit `5d1136e`, CI run [41177669334](https://github.com/SHIV1804/Portfolio/actions/runs/41177669334) passed on the current PR #43 head with TypeScript, lint, build, disposable migration, and full Playwright: **216 passed, 1 skipped**. PR #43 remains open and unmerged.
