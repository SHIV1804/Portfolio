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

## G3 — Architecture Diagram: wrong node selected (9 tests) — 2026-08-20

### What was built
- Scoped `tests/architecture-diagram/architecture-diagram.spec.ts`'s node
  locator to the diagram's own container instead of a bare page-wide
  `page.locator('button[aria-expanded]')`. Added a `diagramNodes(page)`
  helper — `page.locator('.bg-surface-raised').last().locator('button[aria-expanded]')`
  — and replaced all 17 call sites with it, including converting the one
  `page.press('button[aria-expanded]', 'Space')` (raw-selector API) to
  `diagramNodes(page).first().press('Space')` (scoped locator API), since
  `page.press(selector, key)` can't be scoped the same way a `Locator` can.

### Root cause (verified, not assumed)
- Confirmed `widgets/header/ui/Header.tsx:109-116` — the mobile menu
  toggle button really does carry `aria-expanded={isMobileMenuOpen}`,
  `aria-controls="mobile-nav"`, and a `md:hidden` class (hidden at ≥768px,
  the exact desktop-Chrome viewport this repo's `playwright.config.ts`
  uses via `devices['Desktop Chrome']`, default 1280×720).
- Confirmed `app/layout.tsx:36-37` renders `<Header />` before `<main>`,
  so the header button is always earlier in DOM order than anything on
  the page, including the diagram's own nodes.
- Confirmed the diagram's own node buttons
  (`widgets/case-study-layout/ui/ArchitectureDiagram.tsx:41-52`) also
  carry `aria-expanded`/`aria-controls` — they're legitimate matches for
  the bare selector too, just not the *first* one.
- Net effect: `page.locator('button[aria-expanded]').first()` resolves to
  the header's mobile-menu button, which is present in the DOM but
  `display:none` at desktop viewport. Playwright's actionability checks
  (visible/stable/enabled) then time out on click/focus attempts against
  it — exactly the reported error. The hypothesis in the triage doc was
  correct.
- **Not a regression from day one** — checked via `git log --follow` on
  both files: the test file and the original `ArchitectureDiagram.tsx`
  were both added in the same commit (`f078bda`, 2026-07-08), and at that
  point `Header.tsx` had **no** `aria-expanded` anywhere (confirmed via
  `git show f078bda:widgets/header/ui/Header.tsx`) — the bare selector was
  unambiguous when the test was written. The mobile menu button (with its
  own `aria-expanded`) was added 3 days later in `76cd5ca` ("fix: missing
  header on routes and add mobile menu", 2026-07-11), which is what broke
  this test as an unrelated side effect. So this test did pass originally
  and regressed due to an unrelated header change, not "always broken."

### Files created/modified
- `tests/architecture-diagram/architecture-diagram.spec.ts` (added
  `diagramNodes(page)` helper; replaced all 17 raw-selector call sites)
- `PLAYWRIGHT_TRIAGE_PROGRESS.md` (this entry)
- No app code touched (`Header.tsx`, `ArchitectureDiagram.tsx`,
  `app/layout.tsx` all read-only for diagnosis, not modified) — this was
  a test-only fix, consistent with every prior chunk's precedent.

### Verification performed
- `pnpm run lint`: 0 errors (same 14 pre-existing warnings; 3 of them —
  `initialExpanded`, `isVisible`, `context` unused-vars — are inside this
  same spec file but pre-date this change and are unrelated to the
  selector fix).
- **Playwright was NOT run.** `npx playwright install chromium` failed
  again in this sandbox (browser download blocked), consistent with every
  prior chunk. The fix rests on the code-level DOM/CSS evidence above, not
  a live run.

### Known issues / blocked items
- Same as G1: needs a session/machine with real browser access to run
  `tests/architecture-diagram/architecture-diagram.spec.ts` for real and
  confirm all 9 previously-failing tests (plus the file's other,
  previously-passing tests) still pass with the scoped locator.

### Next
- G2 (Command Palette navigation URL bug — flagged as needing a decision,
  not fixed yet), G4 (footer placeholder-URL test — flagged, needs
  decision), G5 (scroll-pin click interception — flagged, possible real
  UX bug), G6 (4 independent responsive/theme failures — flagged, needs
  decision) remain pending per the triage doc's checkpoints.
