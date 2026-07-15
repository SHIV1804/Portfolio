# Blog Moderation System — Auth & DB Progress Log

## Chunk 0 — Database + Auth Infrastructure — 2026-07-15
### What was built
- Documented manual setup requirements for Neon (Postgres) and GitHub OAuth.
- Updated `.env.example` with required environment variables for NextAuth and Prisma.

### Decisions made (and why)
- **Auth Provider**: GitHub OAuth only, as specified in the architecture.
- **Admin Identification**: Using `ADMIN_EMAIL` env var for runtime admin checks to avoid complex RBAC UI in this initial phase.
- **Database**: Neon Postgres with Prisma ORM for type-safe database access.

### Files created/modified
- `BLOG_AUTH_PROGRESS.md` (Created)
- `.env.example` (Modified)

### Verification performed (real commands run, real results)
- Initialized progress log and verified architecture requirements.

### Known issues / blocked items
- **Manual Step Required**: Owner must create a GitHub OAuth App and provide `GITHUB_ID` and `GITHUB_SECRET`.
- **Manual Step Required**: Owner must provide a real Neon `DATABASE_URL` for production/local development.

### Next chunk to run
- Step 2: Install dependencies and write schema.prisma.

## Chunk 0 — Step 2 — 2026-07-15
### What was built
- Installed `next-auth`, `@auth/prisma-adapter`, `prisma`, and `@prisma/client`.
- Created `prisma/schema.prisma` with standard Auth.js models and a custom `Post` model.

### Decisions made (and why)
- **Post Status Enum**: Included `PENDING`, `APPROVED`, `REJECTED` to support the moderation workflow.
- **Slug Unique Constraint**: Ensures each blog post has a unique URL.
- **Cascading Deletes**: Wired `onDelete: Cascade` for `Account`, `Session`, and `Post` when a `User` is deleted to maintain data integrity.

### Files created/modified
- `prisma/schema.prisma` (Created)
- `package.json` (Modified)
- `package-lock.json` (Modified)

### Verification performed (real commands run, real results)
- `npm install`: Successfully installed dependencies.
- Verified `prisma/schema.prisma` content matches requirements.

### Known issues / blocked items
- None.

### Next chunk to run
- Step 3: Run prisma migrate dev and verify tables.

## Chunk 0 — Step 3 — 2026-07-15
### What was built
- Ran `npx prisma migrate dev --name init` to create database tables in Neon.
- Verified table creation using `npx prisma db pull`.

### Decisions made (and why)
- **Prisma Version Downgrade**: Downgraded Prisma to `6.2.1` because Prisma `7.x` has breaking changes regarding `datasource url` in schema files that require a different configuration approach (Accelerate/Direct adapters). Using `6.2.1` maintains compatibility with the requested architecture while ensuring stability.

### Files created/modified
- `prisma/migrations/` (Created)
- `package.json` (Modified - downgraded Prisma)
- `package-lock.json` (Modified)

### Verification performed (real commands run, real results)
- `npx prisma migrate dev`: Successfully applied `20260714185345_init`.
- `npx prisma db pull`: Successfully introspected 5 models (`User`, `Account`, `Session`, `VerificationToken`, `Post`), confirming they exist in the Neon database.

### Known issues / blocked items
- None.

### Next chunk to run
- Step 4: Create NextAuth route handler.

## Chunk 0 — Step 4 — 2026-07-15
### What was built
- Created NextAuth route handler in `app/api/auth/[...nextauth]/route.ts`.
- Configured GitHub OAuth provider and Prisma adapter.
- Implemented `session` callback for admin identification.

### Decisions made (and why)
- **Session Callback**: Added `isAdmin` flag to the session object based on the `ADMIN_EMAIL` environment variable. This allows the frontend to easily check for admin privileges without repeated email comparisons.
- **Prisma Client Instance**: Created a new `PrismaClient` instance within the route handler. For production, this should ideally be a shared singleton in `shared/lib/prisma.ts` to prevent exhaustion of database connections, but for this infrastructure chunk, the inline approach suffices.

### Files created/modified
- `app/api/auth/[...nextauth]/route.ts` (Created)

### Verification performed (real commands run, real results)
- Verified route handler syntax and NextAuth configuration.

### Known issues / blocked items
- None.

### Next chunk to run
- Step 5: Add minimal auth test page.

## Chunk 0 — Step 5 — 2026-07-15
### What was built
- Created `shared/lib/auth-provider.tsx` to wrap the application with NextAuth's `SessionProvider`.
- Modified `app/layout.tsx` to include the `AuthProvider`.
- Added a minimal test page at `app/auth-test/page.tsx` to verify sign-in/sign-out flow and admin status.

### Decisions made (and why)
- **Separate AuthProvider**: Created a client-side wrapper for `SessionProvider` to keep `app/layout.tsx` as a server component where possible (though it's already using `ThemeProvider` which is likely a client component).
- **Minimalist Test UI**: The test page is strictly functional, providing clear feedback on the current session state and admin status.

### Files created/modified
- `shared/lib/auth-provider.tsx` (Created)
- `app/layout.tsx` (Modified)
- `app/auth-test/page.tsx` (Created)

### Verification performed (real commands run, real results)
- Verified that the `AuthProvider` is correctly integrated into the root layout.
- Checked `app/auth-test/page.tsx` for correct usage of `useSession`.

### Known issues / blocked items
- **Live Testing**: Cannot perform a full GitHub OAuth flow in this environment without a real `GITHUB_ID` and `GITHUB_SECRET` configured in a live environment.

### Next chunk to run
- Step 6: Run build and lint.

## Chunk 0 — Step 6 — 2026-07-15
### What was built
- Fixed ESLint errors in `app/api/auth/[...nextauth]/route.ts` and `app/auth-test/page.tsx` by adding proper TypeScript interfaces for NextAuth sessions.
- Ran `npm run lint` and `npm run build` to verify the entire application.

### Decisions made (and why)
- **TypeScript Declaration Merging**: Used `declare module "next-auth"` to extend the `Session` interface, ensuring type safety for the custom `id` and `isAdmin` properties without using `any`.
- **Linting Fixes**: Prioritized fixing all errors to ensure build stability, while leaving existing warnings in test files untouched as they were pre-existing.

### Files created/modified
- `app/api/auth/[...nextauth]/route.ts` (Modified)
- `app/auth-test/page.tsx` (Modified)

### Verification performed (real commands run, real results)
- `npm run lint`: Passed with 0 errors (11 pre-existing warnings in tests).
- `npm run build`: Passed successfully. All routes, including the new `/auth-test` and `/api/auth/[...nextauth]`, were compiled correctly.

### Known issues / blocked items
- **GitHub Sign-in**: As previously stated, live testing requires the owner's OAuth App credentials.

### Next chunk to run
- Chunk 1: Post-writing form and database persistence (to be defined in the next chunk).

### Prisma Singleton Implementation
- Created `shared/lib/prisma.ts` to implement the Prisma Client as a singleton, preventing multiple instances in development during hot-reloads.
- Updated `app/api/auth/[...nextauth]/route.ts` to import and use the shared Prisma singleton instance.

### Decisions made (and why)
- **Prisma Singleton**: This pattern is crucial for Next.js applications to avoid exhausting database connections, especially in development environments with hot module reloading. It ensures that only one instance of `PrismaClient` is active.

### Files created/modified
- `shared/lib/prisma.ts` (Created)
- `app/api/auth/[...nextauth]/route.ts` (Modified)

### UI Integration & Metadata Fix
- Carefully merged `app/layout.tsx` to preserve the existing `Header` and `Footer` components while wrapping the application in `AuthProvider`.
- Fixed `metadataBase` in `app/layout.tsx` to use the correct production URL: `https://portfolio-theta-ruby-31nqvqjqmc.vercel.app`.

### Decisions made (and why)
- **UI Preservation**: It was critical to maintain the UI fixes from commit `76cd5cac` (Header/Footer) while adding the auth infrastructure.
- **Metadata Fix**: The incorrect `metadataBase` was causing confusion for external tools and agents; updating it ensures SEO and OpenGraph tags are generated correctly for the real production domain.

### Verification performed (real commands run, real results)
- `npm run lint`: Passed with 0 errors (11 pre-existing warnings in tests).
- `npm run build`: Passed successfully. All routes compiled, and UI preservation (Header/Footer) was verified by inspecting the layout integration.

## Chunk 0 — Fix: GitHub Sign-in Callback Error — 2026-07-15
### What was built
- Added `refresh_token_expires_in` field to the `Account` model in `prisma/schema.prisma` to support GitHub's OAuth token response.
- Created and applied migration `20260715044722_add_refresh_token_expires_in`.
- Cleaned up orphaned `User` row (`cmrlle2mq0000l704006zh588`) from the database.
- Improved `app/auth-test/page.tsx` with a loading timeout and error messaging for better UX and easier debugging.

### Decisions made (and why)
- **Schema Update**: GitHub recently added `refresh_token_expires_in` to their OAuth response. Since Auth.js passes this field through to the adapter, Prisma requires a corresponding column to avoid validation errors during sign-in.
- **Loading Timeout**: Added a 5-second timeout to the auth test page to prevent infinite silent loading states, providing users with actionable feedback if the session fails to load.

### Files created/modified
- `prisma/schema.prisma` (Modified)
- `prisma/migrations/20260715044722_add_refresh_token_expires_in/` (Created)
- `app/auth-test/page.tsx` (Modified)

### Verification performed (real commands run, real results)
- `npx prisma migrate dev`: Successfully applied the schema change to Neon.
- `npx prisma db execute`: Successfully deleted the orphaned user row.
- `npm run lint` & `npm run build`: Both passed successfully.
