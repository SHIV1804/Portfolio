# docs/history/

Chronological session logs from prior development work — preserved as an audit trail, not rewritten. Each file is a first-hand record of what was built, decided, and verified in that session, including real command output.

Current-state summaries derived from these logs live at the repo root: `TASKS.md` (status), `DECISIONS.md` (rationale), `ARCHITECTURE.md` (structure), `docs/CONTENT.md` (content-integrity inventory). Read those first; come here for the full detail behind any specific item.

| File | Covers |
|---|---|
| `AI_HANDOFF.md` | Cross-session handoff notes: header/footer fix, mobile menu, contact form audit, XSS fix, duplicate-landmark fix |
| `BLOG_AUTH_PROGRESS.md` | Blog moderation system: Prisma/NextAuth infrastructure, admin gating, post submission flow |
| `CONTENT_VERIFICATION_PROGRESS.md` | Full claim-by-claim audit of the Log Analyser case-study page |
| `DSA_FEATURE_PROGRESS.md` | DSA repo setup, GitHub-sync integration, webhook, accessibility landmark fixes |
| `DSA_FLAGSHIP_PROGRESS.md` | The two-sum and max-sum-subarray interactive walkthroughs, chunk by chunk |
| `LIGHTHOUSE_AUDIT_PROGRESS.md` | Performance audit attempts, including the sandbox network limitation and the owner-reported Session 2 results |
| `PLAYWRIGHT_TRIAGE_PROGRESS.md` | E2E test failure root-causing (command palette, architecture diagram, navigation race) |
| `RESUME_FIX_LOG.md` | Metrics/URL correction pass |

Referenced by file path from `TASKS.md`/`DECISIONS.md`/`docs/CONTENT.md` — if you rename or remove a file here, update those references.
