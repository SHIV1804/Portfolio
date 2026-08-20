# Playwright Suite Triage — Progress Log

Tracks fixes to the pre-existing 28 Playwright failures identified while
verifying the DSA flagship checkpoint (full suite: 166 passed, 28 failed,
1 skipped, none overlapping files touched by the DSA/main-footer work).
Grouped as G1–G6 per the triage doc; each section here corresponds to one
of those groups.

## G1 — Command Palette: broken locator (9 tests) — 2026-08-20

### What was built
- Fixed a broken CSS attribute selector, `[label="Command Palette"]`,
  used in 10 places across 3 spec files, to the correct
  `[aria-label="Command Palette"]`.

### Root cause (verified, not assumed)
- The command palette component (`widgets/command-palette/ui/CommandPalette.tsx:71`)
  renders `<Command.Dialog ... label="Command Palette" ...>`, where
  `Command.Dialog` is `cmdk`'s wrapper.
- Read `cmdk`'s actual source (`node_modules/cmdk/dist/index.mjs`): the
  `Dialog` component passes its `label` prop straight through as
  `aria-label` on the underlying Radix `Dialog.Content` element —
  `t.createElement(w.Content,{"aria-label":r.label,"cmdk-dialog":"",...})`.
  So the real DOM never has a literal `label="..."` attribute; the
  accessible name lives in `aria-label="Command Palette"`.
- `[label="Command Palette"]` is a plain HTML attribute selector and
  matches nothing, since no element in this app has a literal `label`
  attribute holding that string. The hypothesis in the triage doc was
  correct — this was a pure test-file typo (`label=` vs `aria-label=`),
  not an app bug. The app component was **not** touched.

### Confirmed: all 9 (and 1 skipped, and 2 more) share the identical cause
Checked every occurrence individually (not assumed from matching error
text):
- `tests/command-palette/command-palette.spec.ts` — 8 occurrences:
  - Line 11: "Ctrl+K (Windows/Linux) opens command palette" — one of the 9 failing
  - Line 26: "Meta+K opens command palette on Mac" — `test.skip(browserName !== 'webkit', ...)`; this repo's `playwright.config.ts` only configures a `chromium` project, so this test is always skipped, never counted among the 9 failures, but fixed for consistency
  - Line 68: "Escape closes the command palette" — one of the 9
  - Line 95: "Enter selects a highlighted command" — uses `.not.toBeVisible()`; with the broken selector this assertion trivially passed (0 matched elements = "not visible"), masking the test's real, separate failure (URL not updating — this is G2's issue, tracked independently, not touched here)
  - Line 199: "Resume download command attempts to open PDF" — also `.not.toBeVisible()`, also trivially passing before the fix, not among the 9 counted failures but fixed so the assertion is now meaningful
  - Line 223: "external link commands do not break palette" — one of the 9
  - Line 238: "command palette is not accessible without keyboard shortcut being pressed" — `.not.toBeVisible()` before the palette is ever opened; trivially true either way, fixed for consistency
  - Line 251: "clicking the Search trigger button opens command palette" — one of the 9
- `tests/reduced-motion/reduced-motion.spec.ts:132` — "command palette works with reduced motion" — one of the 9
- `tests/responsive/responsive.spec.ts:72` — "command palette opens and is viewable at ${viewport.name}", parameterized over 4 viewports (Small Mobile/Large Mobile/Tablet/Desktop) — the remaining 4 of the 9

4 (command-palette.spec.ts) + 1 (reduced-motion) + 4 (responsive, 4 viewports) = 9, matching the triage doc's count exactly.

### Files created/modified
- `tests/command-palette/command-palette.spec.ts` (8 occurrences fixed)
- `tests/reduced-motion/reduced-motion.spec.ts` (1 occurrence fixed)
- `tests/responsive/responsive.spec.ts` (1 occurrence fixed)
- `PLAYWRIGHT_TRIAGE_PROGRESS.md` (created — this file)

### Verification performed
- `pnpm run lint`: 0 errors (same 14 pre-existing warnings elsewhere, unchanged).
- **Playwright was NOT run.** `npx playwright install chromium` failed with
  the same error every prior session in this sandbox has hit:
  `403 Host not in allowlist: cdn.playwright.dev`. No browser binary
  exists or can be downloaded here, so no "raw pass/fail per test" output
  exists — none is fabricated. The fix's correctness rests on the
  `cmdk` source-code evidence above (the actual DOM attribute Radix
  renders), not on a live run.

### Known issues / blocked items
- Same sandbox limitation as the DSA flagship chunks: no Playwright
  browser access. **Needs a session/machine with real browser access to
  run `tests/command-palette/command-palette.spec.ts`,
  `tests/reduced-motion/reduced-motion.spec.ts`, and
  `tests/responsive/responsive.spec.ts` for real and confirm all 9 (plus
  the 2 previously-trivially-passing assertions) now pass meaningfully.**

### Next
- G2 (Command Palette navigation URL bug) and G3 (Architecture Diagram
  wrong node) are separate, already-diagnosed-elsewhere or pending
  investigations — not part of this entry.
