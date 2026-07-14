# Blog Moderation Feature — Progress Log

## Chunk 0 — Database + Auth Infrastructure — 2026-07-14
### What was built
- Initialized `BLOG_AUTH_PROGRESS.md` to track feature development.
- Defined manual setup steps for the project owner (Neon DB and GitHub OAuth).
- Installed core dependencies: `next-auth`, `@auth/prisma-adapter`, `prisma`, and `@prisma/client`.
- Created `prisma/schema.prisma` with standard Auth.js models and a new `Post` model for moderation.
- Updated `.env.example` with required environment variables.

### Decisions made (and why)
- **Auth.js (NextAuth.js)**: Chosen for seamless integration with Next.js and robust GitHub OAuth support.
- **Neon (PostgreSQL)**: Used for the database layer as a scalable, serverless Postgres provider.
- **Prisma**: Selected as the ORM for type-safe database access and easy schema management.
- **Admin Identification**: Decided to use `ADMIN_EMAIL` env var for admin checks to avoid complex role-management UI in the early stages.

### Files created/modified
- `BLOG_AUTH_PROGRESS.md` (Created)
- `prisma/schema.prisma` (Created)
- `package.json` (Modified)
- `.env.example` (Modified)

### Verification performed (real commands run, real results)
- `npm run build`: [Pending result]
- `npm run lint`: [Pending result]

### Known issues / blocked items
- No database connection yet; manual owner steps required.
- NextAuth route handler not yet implemented (deferred to Chunk 1).

### Next chunk to run
- Chunk 1: NextAuth route handler, session provider, and throwaway test page.

---

## Manual Setup Steps for Project Owner
To complete the infrastructure setup, please perform the following actions:

1. **Database Setup (Neon)**:
   - Create a free project at [Neon.tech](https://neon.tech).
   - Copy the `DATABASE_URL` connection string.

2. **GitHub OAuth Setup**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers).
   - Create a **New OAuth App**.
   - **Homepage URL**: `https://portfolio-theta-ruby-31nqvqjqmc.vercel.app`
   - **Authorization callback URL**: `https://portfolio-theta-ruby-31nqvqjqmc.vercel.app/api/auth/callback/github`
   - Copy the generated `GITHUB_ID` and `GITHUB_SECRET`.

3. **Environment Variables**:
   Add the following variables to your Vercel project settings:
   - `DATABASE_URL`: (From Neon)
   - `GITHUB_ID`: (From GitHub)
   - `GITHUB_SECRET`: (From GitHub)
   - `NEXTAUTH_SECRET`: Generate using `openssl rand -hex 32`
   - `NEXTAUTH_URL`: `https://portfolio-theta-ruby-31nqvqjqmc.vercel.app`
   - `ADMIN_EMAIL`: Your GitHub account email.
