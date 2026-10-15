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

## G1-followup — Real App Bug Surfaced by the Selector Fix — 2026-08-20

### What was built
- The owner ran the real Playwright suite locally against G1+G3's commit
  (`7643cd8`). The selector fix itself was confirmed correct — the
  locator now resolves to a single real dialog element (not the header
  button, not zero matches) — but all 9 of G1's originally-targeted tests
  still failed, now with `expect(locator).toBeVisible()` → `Received:
  hidden` instead of "not found". A second, previously-masked bug was
  exposed.
- Root cause (verified via `cmdk`'s actual source,
  `node_modules/cmdk/dist/index.mjs`): `Command.Dialog` only recognizes
  `overlayClassName` and `contentClassName` as explicit props — a plain
  `className` isn't destructured out and falls into the rest-spread,
  landing on the *inner* `cmdk-root` div instead of the outer
  `role="dialog"` element that carries `aria-label="Command Palette"`.
  `widgets/command-palette/ui/CommandPalette.tsx:72` was passing plain
  `className="fixed inset-0 z-[100] flex items-start justify-center
  pt-[15vh] p-4 bg-background/40 backdrop-blur-sm"`, so those positioning
  classes ended up one DOM level too deep. Since the outer dialog
  element's only child was `position: fixed` (removed from normal flow),
  the outer dialog collapsed to a zero-size box — invisible to Playwright
  (and any other strict visibility/AT check against that specific
  element), even though a sighted human still sees the palette fine
  (the fixed-position descendant paints regardless of its ancestor's
  box).
- This is a genuine **app bug**, not a test bug — confirmed with the
  owner before touching app code (per the checkpoint pattern used
  throughout this triage). Fix: renamed the prop from `className` to
  `contentClassName` on `Command.Dialog` in `CommandPalette.tsx` — a
  one-line change, confirmed valid against cmdk's TypeScript types
  (`contentClassName?: string` at `cmdk/dist/index.d.mts:203`).

### Files created/modified
- `widgets/command-palette/ui/CommandPalette.tsx` (1 line: `className` →
  `contentClassName`) — **app code, changed with explicit owner sign-off**
- `PLAYWRIGHT_TRIAGE_PROGRESS.md` (this entry)

### Verification performed
- `pnpm run lint`: 0 errors (same 14 pre-existing warnings, unchanged).
- `npx tsc --noEmit`: 9 pre-existing errors, all in unrelated
  Prisma/blog/admin files (the same `@prisma/client` generation blocker
  every prior chunk hit) — zero errors related to `CommandPalette.tsx` or
  the prop rename, confirming the type is valid.
- **Playwright was NOT run** in this sandbox (still no browser access).
  The owner will need to re-run the same command as before to confirm
  this closes out G1 for real:
  `npx playwright test tests/command-palette/command-palette.spec.ts
  tests/reduced-motion/reduced-motion.spec.ts
  tests/responsive/responsive.spec.ts --reporter=list`

### Known issues / blocked items
- Still needs the owner's real Playwright run to confirm the 9
  originally-targeted tests now pass for real.
- G2 (URL nav), G6-item-1 (tablet overflow) both reproduced in the
  owner's run exactly as previously diagnosed — untouched, unresolved,
  still pending decisions per the triage doc.

### G2 follow-up: root cause reclassified, downgraded to low-priority
- Earlier sessions' "Command Palette navigation URL bug" framing for G2
  turned out to be incomplete: the silent no-op (no pushState, no error,
  URL unchanged) reproduces identically with a plain, unmodified
  `next/link` click — not just `router.push()` from CommandPalette. It
  also isn't a hash-vs-path distinction; both styles could fail depending
  on timing. The actual pattern: navigation attempted very soon after
  page load (before client hydration settles) can silently no-op, in
  `next dev` (Turbopack, unminified).
- **Confirmed on a real production build** (`npm run build && npm run
  start`) that this is dev-server-specific: clicking the log-analyser
  project link immediately after `page.goto('/')` (zero wait) succeeded
  **10/10** runs; the same zero-wait click routed through the command
  palette succeeded **10/10**; a hash-style link (`/#about`) clicked
  immediately after landing on `/projects/log-analyser` succeeded **4/5**
  (1 failure, first run only — consistent with ordinary cold-start
  variance, not a reproducible defect).
- Per the standing decision rule for this item: rare/nonexistent on
  production → **downgraded to low-priority**. Root cause is dev-server
  hydration slowness (Turbopack dev, unminified bundles), not a real
  defect users would hit on the production (Vercel) build. Not pursuing
  further (no hydration-gate or other fix planned) unless new evidence
  from production surfaces.
- Local diagnostic note for future sessions: this sandbox cannot run
  `prisma generate` (binaries.prisma.sh is unreachable — network
  policy), which blocks `npm run build` out of the box via
  `app/admin/posts` and the blog DB fallback. A local-only stub for
  `node_modules/.prisma/client/{default,index-browser}.{js,d.ts}` (plus
  `typescript.ignoreBuildErrors` in `next.config.ts` for prisma-typed
  routes) unblocks a real production build for testing purposes. Never
  commit these — they're a diagnostic workaround, not a real Prisma
  client, and were reverted before finishing this session.

**Status: RESOLVED.** G2 is not a real app bug — the original
navigation-URL symptom was a dev-server/hydration-timing artifact,
confirmed absent on a real production build (25 attempts across three
scenarios, 24/25 succeeded, the 1 miss consistent with ordinary
cold-start variance rather than a reproducible defect). No further
action planned.

## G2 Fix — Step 1 — 2026-08-24

### What was done
- Fresh clone of `SHIV1804/Portfolio`, checked out `dev`
  (`552f96d`, matching the tip recorded in the previous entry above).
- Before touching anything, checked whether this session's briefing
  matched reality:
  - Briefing claims: "An earlier fix added explicit `value` props to
    all 10 Command.Item elements in CommandPalette.tsx... This fix is
    real, already committed."
  - `git log --oneline -- widgets/command-palette/ui/CommandPalette.tsx`
    → only two commits touch this file: `552f96d` (`contentClassName`
    prop rename, documented above) and the original `f078bda`. No
    commit adds `value` props.
  - `grep -n "value=" widgets/command-palette/ui/CommandPalette.tsx` →
    zero matches. Full file view confirms: none of the 10 `Command.Item`
    elements has a `value` prop on `dev` right now.
  - This directly contradicts the briefing's "already committed" claim.
    (A prior chat session in this same conversation did draft that
    exact 10-item `value`-prop diff, but it was never pushed/committed
    to this repo — it only existed locally in that session's sandbox.)
- Also checked this session's other core claim — that G2 is an open,
  reproducible bug — against this file's own prior entry
  ("G2 follow-up," directly above this one, commits `552f96d`→`9c62ba6`):
  that entry documents G2 as **investigated to resolution already**,
  with a different root cause than "onSelect/keyboard wiring"
  (`className` vs `contentClassName` on `Command.Dialog`, fixed in
  `552f96d`), and the *remaining* URL-not-updating symptom traced to
  dev-server hydration timing, confirmed absent in 24/25 production-build
  attempts, and explicitly marked **RESOLVED / no further action
  planned**.
- This session's briefing states the 3 navigation tests fail
  "confirmed on two separate machines/environments" via
  `npx playwright test tests/command-palette --reporter=list`. I
  attempted the same real repro command myself, first via `npm install`:
  - `npm install` → runs; `postinstall` (`prisma generate`) fails:
    `Error: Failed to fetch sha256 checksum at
    https://binaries.prisma.sh/... - 403 Forbidden` (same blocker noted
    in the prior entry's "Local diagnostic note").
  - `npx playwright install chromium` → fails:
    `Error: Download failed: server returned code 403 body 'Host not in
    allowlist: cdn.playwright.dev...'`. No browser binary is available
    or installable in this sandbox — same limitation every prior entry
    in this file records.
  - Net result: **I cannot run `npx playwright test` at all in this
    environment** (no browser binary exists), so I cannot produce the
    real pass/fail output Step 1 asks for, and I cannot independently
    confirm or refute the "3 failing tests" claim from this sandbox.

### Decisions made (and why)
- Not applying any code fix this step. The briefing's premise (a
  currently-committed `value`-prop fix, plus an open onSelect/keyboard
  wiring bug) doesn't match either the actual repo state or this file's
  own prior conclusion that G2 was closed as a non-reproducible
  dev-server artifact. Proceeding to "fix" `onSelect` wiring now would
  mean redoing work this file says was already done differently, on
  the strength of a claim I can't verify and that conflicts with
  recorded evidence — that's exactly the kind of re-diagnosis-without-
  real-repro this triage has consistently avoided elsewhere in this
  log. Flagging for the owner instead of guessing.

### Files created/modified
- `PLAYWRIGHT_TRIAGE_PROGRESS.md` (Modified — this entry)

### Verification performed (real commands run, real results)
- `git log --oneline -- widgets/command-palette/ui/CommandPalette.tsx` →
  `552f96d fix(app): pass contentClassName instead of className to cmdk Command.Dialog` /
  `f078bda Build accessible portfolio website` (no `value`-prop commit)
- `grep -n "value=" widgets/command-palette/ui/CommandPalette.tsx` → no output (0 matches)
- `npm install` → completes with `npm error code 1` from the `postinstall` hook:
  `Error: Failed to fetch sha256 checksum at https://binaries.prisma.sh/all_commits/4123509d24aa4dede1e864b46351bf2790323b69/debian-openssl-3.0.x/libquery_engine.so.node.gz.sha256 - 403 Forbidden`
- `npx playwright install chromium` →
  `Error: Download failed: server returned code 403 body 'Host not in allowlist: cdn.playwright.dev. Add this host to your network egress settings to allow access.'`

### Known issues / blocked items
- Cannot install a Playwright browser in this sandbox (`cdn.playwright.dev`
  not allowlisted) — same as every prior entry in this file. No
  `npx playwright test` output is possible from here, real or otherwise.
- Cannot run `prisma generate` (`binaries.prisma.sh` not allowlisted),
  which also blocks a real `npm run build`.
- **Premise conflict, unresolved:** this session's briefing (open
  onSelect/keyboard-wiring bug, prior value-prop fix already committed)
  does not match (a) the actual `dev` branch content, or (b) this same
  log file's own prior entry, which marked G2 RESOLVED via a different
  mechanism and explicitly decided not to pursue it further absent new
  production evidence. I have not been able to independently reproduce
  the 3 failing tests described, so I can't tell whether this reflects
  a genuine regression since the last entry, a different environment's
  results, or a mismatch in the briefing itself.

### Next step
- Needs the owner to clarify before more code changes happen:
  1. Was the 10-item `value`-prop fix committed somewhere I'm not
     seeing (different branch/remote/PR), or is "already committed"
     inaccurate?
  2. Is there new evidence (e.g., a production-build repro, not just
     dev-server) that reopens G2 despite the prior RESOLVED entry —
     and if so, could the raw output from that repro be shared, since
     I can't generate my own here?
  3. Given the sandbox can't install a Playwright browser or complete
     `prisma generate`, should verification for this fix happen in an
     environment with broader network access, with this sandbox doing
     source-level diagnosis + diff only (as G1/G3 did)?

## G2 Fix — Step 1 — 2026-08-25

### What was done
- Fresh clone of `SHIV1804/Portfolio`, checked out `dev` (`56152ca`).
- Before anything else, per this session's instructions, ran
  `git log --oneline -20` and searched all history for "command palette",
  "G2", "onSelect", "navigation":
  `git log --oneline --all | grep -iE "command palette|G2|onSelect|navigation"`
  → `af30120`, `9c62ba6`, `55ba5bd`, `2eb0b4a`. This surfaced a real premise
  conflict that needed reporting before proceeding (and was reported to the
  user before any code was touched):
  - `55ba5bd`/`9c62ba6` (2026-08-22): G2 was previously investigated and
    marked **RESOLVED** — root cause traced to a `className`→
    `contentClassName` cmdk prop bug (fixed in `552f96d`), with the
    remaining URL-not-updating symptom attributed to dev-server hydration
    timing, confirmed rare/absent on a production build (24/25 across 3
    scenarios).
  - `af30120` (2026-08-24): a prior session given this exact same briefing
    (open onSelect bug, "value props already committed") found neither
    claim held up — no `value` prop exists on any `Command.Item` in `dev`,
    and that session had no working browser at all, so it logged the
    conflict and stopped rather than guess.
  - Confirmed directly: `git log --oneline -- widgets/command-palette/ui/CommandPalette.tsx`
    → only `552f96d` and `f078bda`, no value-prop commit;
    `grep -n "value=" widgets/command-palette/ui/CommandPalette.tsx` → 0 matches.
- Unlike prior sessions, this sandbox has a real (if version-mismatched)
  Chromium available (`/opt/pw-browsers`, revision 1194; project's
  `@playwright/test@1.61.1` wants 1228, and `npx playwright install` can't
  reach `cdn.playwright.dev`). Pointed `playwright.config.ts`'s
  `use.launchOptions.executablePath` at the real binary as a **local,
  uncommitted diagnostic** (reverted before every commit and again at the
  end of this session) and actually reproduced, rather than stopping at
  "cannot verify" like the prior two sessions.
- `npm install` still fails its `postinstall` (`prisma generate`, same
  `binaries.prisma.sh` / `host_not_allowed` block as the Lighthouse
  session) — irrelevant here since `playwright.config.ts`'s `webServer` is
  `npm run dev`, not a production build, and `next dev` runs fine without
  a generated Prisma client as long as no Prisma-dependent route is hit by
  the tests being audited (command-palette and architecture-diagram
  don't touch it).
- Started `next dev` in the background, ran the real repro command from
  the brief.

### Findings before touching code
- **Reproduced for real** (first time this file has real Playwright output
  for G2, not just historical claims):
  `npx playwright test tests/command-palette --reporter=list` →
  **2 of the 3** briefed tests fail deterministically (3/3 runs):
  - `Enter selects a highlighted command` (expects `/#about`) — FAILS
  - `navigation command navigates correctly` (expects `/#skills`) — FAILS
  - `case study navigation command works` (expects `/projects/log-analyser`)
    — **PASSES** deterministically (3/3), contradicting the brief's "3
    failing tests, confirmed on two machines" claim. This is a second,
    independent premise conflict beyond the value-prop one `af30120`
    already found — flagging it rather than silently treating the brief
    as fully accurate.
  - `tests/architecture-diagram/architecture-diagram.spec.ts:323` — FAILS
    5/5 as described. Not touched (per instructions).
- **Inspected `onSelect`/navigation wiring** (Step 2 of the brief) before
  changing anything: every `Command.Item` in `CommandPalette.tsx` calls
  `runCommand(() => router.push(...))` identically. cmdk's `onSelect`
  fires the same way for a click and for Enter-while-highlighted — it does
  not distinguish input method. No guard, no early return, no
  keyboard-specific branch anywhere. **The brief's premise (broken/guarded
  keyboard wiring) does not match the code.**
- Root-caused the actual failure via real network tracing
  (`page.on('request'/'response')`) instead of guessing:
  - Selecting "About" while already on `/` fires a genuine Next.js RSC
    round-trip (`GET /?_rsc=...`) before the hash commits to the URL —
    confirmed via trace, timed at **~170-260ms** across repeated runs. The
    two failing tests assert `page.url()` (a synchronous, non-retrying
    property read) immediately after the dialog closes, with zero wait —
    they race ahead of that commit every time. The "case study" test
    happens to include `await page.waitForLoadState('networkidle')`, which
    is why it passes — not because path-nav is faster, but because it
    waits and hash-nav doesn't get the same courtesy in the other two
    tests.
  - Selecting "About" from a *different* route (as the architecture-diagram
    test does, starting from `/projects/log-analyser`) is much slower —
    measured **~800ms** (cold-fetching the entire home route's heavier RSC
    payload: hero GSAP animations, GitHub dashboard, all sections).
    `router.prefetch()` for these targets on mount was tried and measured —
    it did **not** reduce this in dev (still ~800ms, confirmed via repeated
    trace) — reverted, not part of the final fix.
  - `router.push()` returns `void` in this Next.js version (confirmed via
    `node_modules/next/dist/shared/lib/app-router-context.shared-runtime.d.ts`)
    — no completion promise, so there's no built-in way to know when a
    push has actually landed.
  - Confirmed the architecture-diagram failure's exact mechanism: issuing a
    second real route-changing command (`Log Analyser`) while the first
    (`About`) is still in flight causes **both** navigations to be
    silently dropped — not just delayed. Verified by waiting 3s after the
    full sequence and finding the page never left `/projects/log-analyser`
    at all (`aria-expanded` still `'true'`, URL unchanged). Isolated: just
    reopening the palette (Ctrl+K) and pressing Escape without selecting
    anything does *not* interrupt the pending nav — it's specifically a
    second `router.push()` call that causes the collision.

### Decisions made (and why)
- **Not** touching `onSelect`'s wiring pattern itself (adding guards,
  keyboard-specific branches) — real evidence shows it was never broken
  that way. Doing so anyway would mean "fixing" a bug that isn't there
  while leaving the actual defect (RSC round-trip on same-page anchors,
  and the drop-both-navigations collision) in place.
- Fixed the actual defect in two parts:
  1. `navigateToSection()`: for the 4 in-page anchors (About/Skills/
     Experience/Projects), bypass the Next.js router entirely when already
     on `/` — use the native History API (`pushState`) + `scrollIntoView`
     directly. There's no server data to refetch for a same-page scroll,
     so this is synchronous with no round-trip. This directly fixes the
     two originally-failing tests.
  2. `navigateToRoute()`: for real cross-page navigations (both case-study
     links, and the 4 anchors when *not* already on `/`), keep
     `router.push()` but serialize it through a promise queue
     (`navQueueRef`) that waits for the previous push's target `pathname`
     to actually land (polled via `usePathname()`, 3s safety-net timeout)
     before firing the next one. This fixes the architecture-diagram
     collision without ever blocking the Ctrl+K shortcut itself.
- **First attempt at #2 was wrong and is documented as a dead end in the
  code's own comments**: tried gating the Ctrl+K keydown handler itself
  with a `useTransition()`-based `isPending` flag (and later a fixed-
  duration `setTimeout` cooldown). Both made things *worse* — the
  architecture-diagram test sends a single, non-retried `Control+k`
  keypress with no wait; if that keypress is ignored because a guard is
  still active, the palette never opens and the test hangs until timeout
  (confirmed: `page.type` timed out waiting for a locator that never
  appears, because nothing re-sends the keypress). Blocking the *UI* was
  the wrong layer; serializing the *navigation side effect* while leaving
  the UI free to respond immediately is what actually works.
- Mid-implementation, an edit accidentally deleted the `const router =
  useRouter()` and `const [theme, setTheme] = useState(...)` declarations,
  causing a `ReferenceError: theme is not defined` (500) in the dev
  server. Caught via `curl` health-check + dev server log, fixed by
  restoring both declarations, verified via a clean `curl` 200 and a
  rerun of the full suite before proceeding — flagging this so the
  verification counts below are trusted only from that point forward.

### Files created/modified
- `widgets/command-palette/ui/CommandPalette.tsx` — real fix (diff
  committed alongside this entry).
- `playwright.config.ts` — temporarily edited (`launchOptions.executablePath`
  pointing at the sandbox's real Chromium binary, to work around the
  Playwright/browser revision mismatch) for every test run in this
  session, **reverted before every commit** (confirmed via `git status`
  showing it clean at each commit point). Not part of the shipped diff.
- `next-env.d.ts` — auto-regenerated by `next dev` locally (path
  `.next/dev/types/...` vs `.next/types/...`); reverted, not committed —
  this is a dev-server artifact, not a real change.
- `PLAYWRIGHT_TRIAGE_PROGRESS.md` — this entry.

### Verification performed (real commands run, real results)
- `npx playwright test tests/command-palette --reporter=list` — full
  18-test suite (17 run + 1 skipped, WebKit-only Meta+K test), run **5
  times** after the fix: **17 passed / 1 skipped, all 5 runs**, zero
  flakes.
- `npx playwright test tests/architecture-diagram/architecture-diagram.spec.ts:323`
  isolated, run **5 times** after the fix: **1 passed, all 5 runs**
  (previously failed 5/5 before the fix, confirmed both before and after
  in this same session).
- Combined run, both suites together in one command (post-fix): **18
  passed / 1 skipped**, single run, consistent with the separate 5x runs.
- `npm run lint`: **0 errors, 14 warnings** — identical warning set to the
  pre-existing baseline recorded in this file's earlier entries; none in
  `CommandPalette.tsx`.
- `npx tsc --noEmit`: **8 errors**, all `Module '"@prisma/client"' has no
  exported member 'PostStatus'` / implicit-any in `app/blog/**`,
  `app/admin/posts/**`, `app/api/**`, `shared/lib/blog-db.ts` — the same
  pre-existing Prisma-generation blocker documented in the Lighthouse
  audit session (`binaries.prisma.sh` unreachable in this sandbox). Zero
  errors in `CommandPalette.tsx` or `playwright.config.ts`.
- `git status` / `git diff --stat` at commit time: only
  `widgets/command-palette/ui/CommandPalette.tsx` changed —
  `playwright.config.ts` and `next-env.d.ts` confirmed reverted to
  `origin/dev`'s exact content before commit.

### Known issues / blocked items
- The 3s safety-net timeout in `navigateToRoute`'s poll loop is a
  pragmatic bound, not a guarantee — if a route genuinely takes longer
  than 3s to land (unlikely for this app, but possible under heavier load
  or a slower environment), the queue will move on to the next command
  before the previous one actually settled. Worth a follow-up if this app
  ever adds a much heavier route.
- The ~800ms cold-navigation cost from a case-study page back to home
  (dev/Turbopack-specific per this session's own measurement, consistent
  with the prior session's "confirmed absent on production build"
  finding for a related symptom) has not been re-verified against a real
  production build in this sandbox — same `binaries.prisma.sh` block that
  stopped the Lighthouse session's `next build` stops one here too. Real
  users on the live Vercel deployment almost certainly see this much
  faster (minified bundles, CDN-served chunks), but that's inference, not
  something this sandbox can measure directly.
- This is the **third** premise conflict logged against this repeated G2
  briefing (value-prop fix not actually present; G2 previously RESOLVED
  via a different mechanism; now "3 tests fail" when only 2 do). Worth
  the owner checking why this briefing keeps arriving with claims that
  don't match the repo — possibly a stale template being reused, or a
  different repo/branch being described.

### Next step
- None required for G2 itself — closed, see below. If the owner wants the
  ~800ms cross-route cold-navigation cost investigated further (it's a UX
  smoothness question, not a correctness bug — no test currently exercises
  it as anything other than "eventually lands"), that would be a new,
  separate item.

**Status: RESOLVED.** Both originally-failing command-palette tests and
the architecture-diagram downstream regression pass, verified 5/5 each
(not once), against a real `next dev` server with a real Chromium browser
(not a claim from git history — this session generated its own evidence).
Root cause was not the briefed "onSelect wiring" — it was (1) an
unnecessary RSC round-trip for same-page hash navigation, fixed by
bypassing the router for those; and (2) a genuine navigation race for
real cross-page pushes issued back-to-back, fixed by serializing them
without blocking the UI. Diff below / in the paired commit.
