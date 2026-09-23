# docs/CONTENT.md

The content-integrity rule and protocol this project runs on, plus the current, code-verified inventory of what's real, placeholder, or verified. Read `AGENTS.md` rule 1 first.

## The rule
No fabrication. Never invent personal facts, metrics, dates, or technical claims for this site. If real content isn't available yet, use an explicit `[PLACEHOLDER: ...]` marker instead of writing something plausible-sounding. If you confirm a claim is true against real evidence, mark it with a `VERIFIED:` comment describing what was checked (a command run, a query result, a file inspected) — not just "verified," which tells a future reader nothing.

## Current placeholder inventory (verified by reading the code)
| Location | Placeholder |
|---|---|
| `widgets/hero-section/ui/HeroSection.tsx` (4th story beat) | `[PLACEHOLDER: bio content pending owner review]` |
| `widgets/about-section/ui/AboutSection.tsx` | `[PLACEHOLDER: bio content pending owner review]` |
| `entities/project/model/data.ts` (`case-study-two`) | `[PLACEHOLDER — project not yet selected]`, `isPlaceholder: true` |
| `app/projects/log-analyser/page.tsx` | Three markers: architecture-diagram description, a code snippet, and an OG image |
| `app/page.tsx`, `app/projects/log-analyser/page.tsx`, `app/projects/case-study-two/page.tsx` | `// [PLACEHOLDER: OG image]` — none of the referenced `/og-*.png` files exist in `public/` |

## Current `VERIFIED:` markers (verified by reading the code)
| Location | What was verified |
|---|---|
| `entities/project/model/data.ts` (`log-analyser`) | "Confirmed via GitHub API query against the real account (`SHIV1804`), no matching implementation exists anywhere" — supports the page's "planned... architecture design in progress" framing |
| `app/projects/log-analyser/page.tsx` (×4) | Individual claims on the case-study page — see the file directly for what each covers |
| `app/api/dsa-webhook/route.ts` | Security rationale for the HMAC verification approach |

## Reporting on unverifiable performance/audit claims
This project's history (`docs/history/CONTENT_VERIFICATION_PROGRESS.md`) sets a precedent worth following: when a real Lighthouse or benchmark run can't be independently reproduced (e.g. due to sandbox network restrictions), report the numbers *as reported by whoever ran them*, with an explicit attribution note — don't silently present them as if independently measured, and don't invent a replacement number. See `docs/history/LIGHTHOUSE_AUDIT_PROGRESS.md` Session 2 for the pattern to follow.

## Full history
The detailed, chronological verification work (every claim on the Log Analyser page inventoried and dispositioned) lives in `docs/history/CONTENT_VERIFICATION_PROGRESS.md`. This file is the current-state summary; that one is the audit trail.
