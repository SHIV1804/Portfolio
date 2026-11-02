# CODEX_CONTEXT

## Purpose
This handoff records the live repo state, the verified facts against the current checkout, and the exact remaining work for a Codex/IDE session. It is intentionally documentation-only and does not change app behavior.

## Repo facts
- Remote base branch state recorded from `git fetch origin --prune`:
  - `origin/main`: `c45006248050a08dc2e9e84dd55468485211226f`
  - `origin/dev`: `7584ad81ad8d2f5bca70f00f0c5a82a5161b613b`
- `origin/dev` contains `origin/main`: yes (`git merge-base --is-ancestor origin/main origin/dev` returned exit code 0 / `dev contains main` in the shell output)
- Current working branch: `docs/codex-handoff` from `origin/dev`
- Current `package.json` declares `next: 16.4.3`; the AGENTS note referencing `next@16.2.10` is stale.
- `npm ci`, `npx prisma generate`, `npx tsc --noEmit`, and `npm run lint` all succeeded in this repo state.
- Relevant Playwright E2E work remains blocked on this Windows machine because the local installation is missing the native `lightningcss.win32-x64-msvc.node` binary required by Tailwind/Next; this is environmental, not a functional app regression.
- `GITHUB_TOKEN` is unset in this local session, which makes live GitHub-backed data fetches non-runnable without secrets.

## Rules / preamble
The session began from the repo-level instructions and constraints in `AGENTS.md` and `CLAUDE.md`:

1. Verify repo state before editing.
2. Do not fabricate claims; use real command output and code evidence.
3. Keep `shared/lib/safe-markdown.ts` as the boundary for visitor-submitted content.
4. Do not change the DSA trace contract without checking both repos.
5. Respect FSD boundaries: `app/` composes routes, other logic belongs in `widgets/`, `features/`, `entities/`, or `shared/`.
6. Use `@/*` imports instead of deep relative imports.
7. Keep design tokens in `app/globals.css` as the source of truth.
8. Run `npm run lint` before finishing work touching app/widgets/features/entities/shared code.
9. If a feature touches Playwright-covered UI, run the relevant E2E tests.
10. Do not replace the safe-markdown pipeline with MDX for untrusted content.
11. `prisma generate` may fail in network-restricted or egress-blocked sandboxes; do not “fix” by removing Prisma code.
12. Keep this task documentation-only and do not merge the branch.

## Task list (REAL numbering from CODEX_IDE_TASKS.md)
- T0: Bootstrap and reconnaissance / handoff creation. Status: done.
- T1: Architecture Decision Record: execution backend (owner gate). Status: done in `DECISIONS.md`; owner approval required before T13. T2-T12 may proceed with the mock provider only.
- T2: Mock provider contract and IDE gating (UI hidden unless `IDE_ENABLED=true`, login only on Run/Submit). Status: not started here.
- T3: DSA repo sync and trace dataset review for execution metadata. Status: not started here.
- T4: Add a provider abstraction and server route contract. Status: not started here.
- T5: Add a safe mock execution endpoint and result normalization. Status: not started here.
- T6: Add auth gate and login requirement only on Run/Submit. Status: not started here.
- T7: Wire the IDE UI into `app/dsa/[pattern]/[slug]/page.tsx` behind `IDE_ENABLED`. Status: not started here.
- T8: Add E2E coverage for idle/invisible state and the gated login flow. Status: not started here.
- T9: Add regression tests for `IDE_ENABLED=false` behavior. Status: not started here.
- T10: Add documentation and env var names in `.env.example` and `BUILD.md`. Status: not started here.
- T11: Add a hidden feature flag and smoke test for the production gate. Status: not started here.
- T12: Final security/accessibility review and release readiness. Status: not started here.
- T13: Owner approval and backend implementation. Status: pending.
- T14: Merge to dev and final release gating. Status: pending.
- T15: Production release only by owner after the release gate passes. Status: pending.

## Release gate
Production release gate (owner policy, mandatory):
- The Online IDE reaches production ONLY when ALL of these are true: (1) tasks T0-T14 are complete and merged into dev; (2) full CI is green on dev, including the E2E, accessibility and security tests and the regression test proving the site is unchanged when IDE_ENABLED=false; (3) the real sandbox is provisioned and its smoke test passed; (4) the owner tested Run and Submit manually on a Vercel Preview while signed in; (5) the owner explicitly approves.
- Until then everything stays behind IDE_ENABLED=false (default) and must be invisible and inert in production: no UI, and the APIs return 404. Never set or suggest setting IDE_ENABLED=true in Production before the gate passes.
- Releases dev -> main are done only by the owner. If dev must be released for another reason before the IDE is complete, first prove with the regression test that IDE_ENABLED=false makes the IDE completely invisible and inert.

## Decisions so far
- The repo is currently on `origin/dev` and the handoff branch was created from that base as requested.
- This is a documentation-only step; no feature code has been altered in the handoff branch.
- The previous `AGENTS.md` note on `next@16.2.10` is stale and should be treated as a documentation discrepancy, not a current repo fact.
- The missing `lightningcss` native binding is a platform issue: the app code itself is not the failing cause.
- The execution backend decision is documented in `DECISIONS.md` as a required owner gate; a mock provider may be used for T2-T12 without production approval.

## NEXT ACTION
1. Complete the mock-provider execution abstraction and the hidden `IDE_ENABLED` gating while keeping the feature inert by default.
2. Continue the task sequence from T2 through T12 using the mock provider, with no production flag enabled.
3. Re-run the relevant Playwright checks in a machine with the required native dependency and the GitHub env vars that the DSA/auth flow expects.
4. Stop when the owner approves the backend and the full release gate conditions are met; do not enable `IDE_ENABLED=true` in production before that approval.
