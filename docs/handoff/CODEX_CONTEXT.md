# CODEX_CONTEXT

## Task status
- Implemented: DSA problem pages now render a lightweight in-page IDE with `Run` and `Submit` actions.
- Gate: GitHub sign-in is triggered only when the user actually clicks `Run` or `Submit`; the page remains viewable without forcing login.
- Branch: `task/dsa-ide-auth-gated`
- Base: `origin/dev`

## Decisions
- The editor is intentionally a local UI stub, not a real judge backend. It uses the existing GitHub OAuth session flow (`next-auth/react` `signIn('github')`) and only prompts for auth at the moment of action.
- This follows the same low-friction pattern already used by the blog's write button and avoids forcing auth for passive DSA browsing.

## Next action
- Hook the `Run` / `Submit` buttons up to the real judge API or backend when that service is available, preserving the same login-on-action requirement.

## PR / CI
- PR: not created in this local sandbox.
- CI: not run in this local sandbox.
